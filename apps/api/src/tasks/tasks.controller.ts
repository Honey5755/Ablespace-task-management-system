import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PublicUser } from '../auth/auth.types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CommentsService } from './comments.service';
import { TasksService, TaskStats, TaskWithRelations } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly comments: CommentsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: QueryTasksDto,
  ): Promise<TaskWithRelations[]> {
    return this.tasks.findAll(user.id, query);
  }

  @Get('stats')
  stats(@CurrentUser() user: PublicUser): Promise<TaskStats> {
    return this.tasks.stats(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    return this.tasks.findOneDetailed(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskWithRelations> {
    return this.tasks.create(user.id, dto);
  }

  // Declared before the ':id' route so "reorder" isn't captured as an id.
  @Patch('reorder')
  reorder(
    @CurrentUser() user: PublicUser,
    @Body() dto: ReorderTasksDto,
  ): Promise<TaskWithRelations[]> {
    return this.tasks.reorder(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskWithRelations> {
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<void> {
    return this.tasks.remove(user.id, id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user.id, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeComment(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.comments.remove(user.id, id, commentId);
  }
}
