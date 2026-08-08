import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PublicUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account no longer exists');

    // email is unique; check first so the client gets a clear 409 rather than
    // a driver-level constraint error.
    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (taken) throw new ConflictException('That email is already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      title: updated.title,
      username: updated.username,
      avatarUrl: updated.avatarUrl,
      isGuest: updated.isGuest,
    };
  }

  /** Backs "Leave Workspace" — deletes the account and cascades its data. */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Account no longer exists');
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
