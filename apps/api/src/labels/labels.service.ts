import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Label } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';

/** Seeded for every new workspace so the detail page has the drawn chip set. */
export const DEFAULT_LABELS = [
  { name: 'Research', color: 'blue' },
  { name: 'Design', color: 'violet' },
  { name: 'Development', color: 'emerald' },
  { name: 'Testing', color: 'amber' },
  { name: 'Deployment', color: 'rose' },
];

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerId: string): Promise<Label[]> {
    return this.prisma.label.findMany({ where: { ownerId }, orderBy: { position: 'asc' } });
  }

  async create(ownerId: string, dto: CreateLabelDto): Promise<Label> {
    const existing = await this.prisma.label.findFirst({
      where: { ownerId, name: dto.name },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`A label named "${dto.name}" already exists`);

    const last = await this.prisma.label.findFirst({
      where: { ownerId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.label.create({
      data: {
        name: dto.name,
        color: dto.color ?? 'neutral',
        position: last ? last.position + 1 : 0,
        ownerId,
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const label = await this.prisma.label.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!label) throw new NotFoundException(`Label ${id} not found`);
    await this.prisma.label.delete({ where: { id } });
  }

  seedDefaults(ownerId: string): Promise<unknown> {
    return this.prisma.label.createMany({
      data: DEFAULT_LABELS.map((label, position) => ({ ...label, position, ownerId })),
    });
  }
}
