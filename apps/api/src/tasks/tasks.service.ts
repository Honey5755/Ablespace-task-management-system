import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PRIORITY_RANK, TaskPriority, TaskStatus } from './task.constants';

/** Shape returned to the client — enough to render a row without an N+1. */
const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  labels: { select: { id: true, name: true, color: true } },
  project: { select: { id: true, name: true } },
  _count: { select: { subtasks: true, comments: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof TASK_INCLUDE }>;

export interface TaskStats {
  total: number;
  backlog: number;
  todo: number;
  doing: number;
  completed: number;
  overdue: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  doing: 'Doing',
  completed: 'Completed',
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, query: QueryTasksDto): Promise<TaskWithRelations[]> {
    const where: Prisma.TaskWhereInput = { ownerId };

    if (query.status?.length) where.status = { in: query.status };
    if (query.priority?.length) where.priority = { in: query.priority };
    if (query.projectId) where.projectId = query.projectId;
    if (query.labelId?.length) where.labels = { some: { id: { in: query.labelId } } };
    if (!query.includeSubtasks) where.parentId = null;

    if (query.search) {
      // `mode: 'insensitive'` is required on PostgreSQL — unlike SQLite, its
      // LIKE is case-sensitive, so omitting this silently breaks search.
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sort = query.sort ?? 'position';
    const order = query.order ?? (sort === 'position' ? 'asc' : 'desc');

    // Priority needs a custom rank, which SQLite can't express as an ORDER BY
    // clause through Prisma — sort those in memory instead.
    if (sort === 'priority') {
      const tasks = await this.prisma.task.findMany({ where, include: TASK_INCLUDE });
      const direction = order === 'asc' ? 1 : -1;
      return tasks.sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority as TaskPriority] - PRIORITY_RANK[b.priority as TaskPriority]) *
          direction,
      );
    }

    return this.prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ [sort]: order }, { createdAt: 'desc' }],
    });
  }

  async findOne(ownerId: string, id: string): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findFirst({
      where: { id, ownerId },
      include: TASK_INCLUDE,
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  /** Detail page payload: the task plus its subtasks, comments and activity feed. */
  async findOneDetailed(ownerId: string, id: string) {
    const task = await this.findOne(ownerId, id);

    const [subtasks, comments, activities] = await Promise.all([
      this.prisma.task.findMany({
        where: { parentId: id, ownerId },
        include: TASK_INCLUDE,
        orderBy: { position: 'asc' },
      }),
      this.prisma.comment.findMany({
        where: { taskId: id },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.activity.findMany({
        where: { taskId: id },
        include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { ...task, subtasks, comments, activities };
  }

  async create(ownerId: string, dto: CreateTaskDto): Promise<TaskWithRelations> {
    const status = dto.status ?? 'todo';

    await Promise.all([
      this.assertOwnedProject(ownerId, dto.projectId),
      this.assertOwnedTask(ownerId, dto.parentId),
      this.assertOwnedLabels(ownerId, dto.labelIds),
    ]);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        status,
        priority: dto.priority ?? 'none',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        completedAt: status === 'completed' ? new Date() : null,
        position: await this.nextPosition(ownerId, status, dto.parentId ?? null),
        ownerId,
        projectId: dto.projectId ?? null,
        parentId: dto.parentId ?? null,
        // Guests are the only member of their own workspace, so an unset
        // assignee defaults to them rather than staying empty.
        assigneeId: dto.assigneeId === undefined ? ownerId : dto.assigneeId,
        ...(dto.labelIds?.length
          ? { labels: { connect: dto.labelIds.map((id) => ({ id })) } }
          : {}),
      },
      include: TASK_INCLUDE,
    });

    await this.recordActivity(task.id, ownerId, 'created', 'created this task');

    return task;
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<TaskWithRelations> {
    const existing = await this.findOne(ownerId, id);

    await Promise.all([
      this.assertOwnedProject(ownerId, dto.projectId),
      this.assertOwnedLabels(ownerId, dto.labelIds),
    ]);

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) throw new BadRequestException('A task cannot be its own parent');
      await this.assertOwnedTask(ownerId, dto.parentId);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.projectId !== undefined) {
      data.project = dto.projectId ? { connect: { id: dto.projectId } } : { disconnect: true };
    }
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }
    if (dto.assigneeId !== undefined) {
      data.assignee = dto.assigneeId ? { connect: { id: dto.assigneeId } } : { disconnect: true };
    }
    if (dto.labelIds !== undefined) {
      data.labels = { set: dto.labelIds.map((labelId) => ({ id: labelId })) };
    }

    const activities: { type: string; message: string }[] = [];

    if (dto.priority !== undefined && dto.priority !== existing.priority) {
      data.priority = dto.priority;
      activities.push({
        type: 'priority_changed',
        message: `changed priority from ${PRIORITY_LABELS[existing.priority]} to ${PRIORITY_LABELS[dto.priority]}`,
      });
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      data.status = dto.status;
      // Stamp completion only on the transition, so re-saving a completed task
      // doesn't keep moving its completedAt forward.
      data.completedAt = dto.status === 'completed' ? new Date() : null;
      if (dto.position === undefined) {
        data.position = await this.nextPosition(ownerId, dto.status, existing.parentId);
      }
      activities.push({
        type: 'status_changed',
        message: `changed status from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[dto.status]}`,
      });
    }

    const task = await this.prisma.task.update({
      where: { id },
      data,
      include: TASK_INCLUDE,
    });

    for (const activity of activities) {
      await this.recordActivity(id, ownerId, activity.type, activity.message);
    }

    return task;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOne(ownerId, id);
    // Subtasks, comments and activities cascade via the schema.
    await this.prisma.task.delete({ where: { id } });
  }

  /**
   * Applies a whole ordered snapshot in one transaction. Scoped by ownerId in
   * the updateMany filter so a forged id in the payload silently affects nothing.
   */
  async reorder(ownerId: string, dto: ReorderTasksDto): Promise<TaskWithRelations[]> {
    await this.prisma.$transaction(
      dto.items.map((item, index) =>
        this.prisma.task.updateMany({
          where: { id: item.id, ownerId },
          data: { status: item.status, position: index },
        }),
      ),
    );

    return this.prisma.task.findMany({
      where: { ownerId, parentId: null },
      include: TASK_INCLUDE,
      orderBy: { position: 'asc' },
    });
  }

  async stats(ownerId: string): Promise<TaskStats> {
    const [grouped, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { ownerId, parentId: null },
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          ownerId,
          parentId: null,
          status: { not: 'completed' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const countFor = (status: TaskStatus): number =>
      grouped.find((g) => g.status === status)?._count._all ?? 0;

    return {
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
      backlog: countFor('backlog'),
      todo: countFor('todo'),
      doing: countFor('doing'),
      completed: countFor('completed'),
      overdue,
    };
  }

  /** Appends to the end of the target group. */
  private async nextPosition(
    ownerId: string,
    status: string,
    parentId: string | null,
  ): Promise<number> {
    const last = await this.prisma.task.findFirst({
      where: { ownerId, status, parentId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last ? last.position + 1 : 0;
  }

  private recordActivity(
    taskId: string,
    actorId: string,
    type: string,
    message: string,
  ): Promise<unknown> {
    return this.prisma.activity.create({ data: { taskId, actorId, type, message } });
  }

  // --- Ownership guards -----------------------------------------------------
  // Relations are connected by id, so each referenced row must be verified as
  // the caller's before it is linked; otherwise a forged id could attach another
  // user's project or label.

  private async assertOwnedProject(ownerId: string, projectId?: string | null): Promise<void> {
    if (!projectId) return;
    const found = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async assertOwnedTask(ownerId: string, taskId?: string | null): Promise<void> {
    if (!taskId) return;
    const found = await this.prisma.task.findFirst({
      where: { id: taskId, ownerId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Task ${taskId} not found`);
  }

  private async assertOwnedLabels(ownerId: string, labelIds?: string[]): Promise<void> {
    if (!labelIds?.length) return;
    const count = await this.prisma.label.count({
      where: { id: { in: labelIds }, ownerId },
    });
    if (count !== labelIds.length) throw new NotFoundException('One or more labels not found');
  }
}
