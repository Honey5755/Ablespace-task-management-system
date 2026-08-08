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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService, ProjectWithRelations } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(
    @CurrentUser() user: PublicUser,
    @Query('search') search?: string,
  ): Promise<ProjectWithRelations[]> {
    return this.projects.findAll(user.id, search);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
  ): Promise<ProjectWithRelations> {
    return this.projects.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectWithRelations> {
    return this.projects.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectWithRelations> {
    return this.projects.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<void> {
    return this.projects.remove(user.id, id);
  }
}
