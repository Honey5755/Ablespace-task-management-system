import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRIORITY_RANK, TaskPriority } from '../tasks/task.constants';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_INCLUDE = {
  lead: { select: { id: true, name: true, email: true, avatarUrl: true } },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof PROJECT_INCLUDE;
}>;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, search?: string): Promise<ProjectWithRelations[]> {
    return this.prisma.project.findMany({
      // Case-insensitive to match the task list's search behaviour; PostgreSQL
      // LIKE is case-sensitive without this.
      where: {
        ownerId,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: PROJECT_INCLUDE,
      orderBy: { position: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(ownerId: string, dto: CreateProjectDto): Promise<ProjectWithRelations> {
    const last = await this.prisma.project.findFirst({
      where: { ownerId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.project.create({
      data: {
        name: dto.name,
        priority: dto.priority ?? 'none',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        // A guest is the only member of their workspace, so they lead by default.
        leadId: dto.leadId === undefined ? ownerId : dto.leadId,
        position: last ? last.position + 1 : 0,
        ownerId,
      },
      include: PROJECT_INCLUDE,
    });
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectWithRelations> {
    await this.findOne(ownerId, id);

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.leadId !== undefined) {
      data.lead = dto.leadId ? { connect: { id: dto.leadId } } : { disconnect: true };
    }

    return this.prisma.project.update({ where: { id }, data, include: PROJECT_INCLUDE });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOne(ownerId, id);
    // Tasks belonging to the project cascade via the schema.
    await this.prisma.project.delete({ where: { id } });
  }

  /** Mirrors the task list's in-memory priority ordering. */
  sortByPriority(projects: ProjectWithRelations[], order: 'asc' | 'desc'): ProjectWithRelations[] {
    const direction = order === 'asc' ? 1 : -1;
    return [...projects].sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority as TaskPriority] - PRIORITY_RANK[b.priority as TaskPriority]) *
        direction,
    );
  }
}
