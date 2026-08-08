import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, CommentsService],
})
export class TasksModule {}
