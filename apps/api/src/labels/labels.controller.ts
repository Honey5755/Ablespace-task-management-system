import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Label } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PublicUser } from '../auth/auth.types';
import { CreateLabelDto } from './dto/create-label.dto';
import { LabelsService } from './labels.service';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private readonly labels: LabelsService) {}

  @Get()
  findAll(@CurrentUser() user: PublicUser): Promise<Label[]> {
    return this.labels.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateLabelDto): Promise<Label> {
    return this.labels.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<void> {
    return this.labels.remove(user.id, id);
  }
}
