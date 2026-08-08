import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const AUTHOR_SELECT = { select: { id: true, name: true, avatarUrl: true } };

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    await this.assertOwnsTask(userId, taskId);

    return this.prisma.comment.create({
      data: { body: dto.body, taskId, authorId: userId },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(userId: string, taskId: string, commentId: string): Promise<void> {
    await this.assertOwnsTask(userId, taskId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
      select: { authorId: true },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  private async assertOwnsTask(userId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, ownerId: userId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
  }
}
