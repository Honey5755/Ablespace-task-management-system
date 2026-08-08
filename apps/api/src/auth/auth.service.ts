import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { seedWorkspace } from '../workspace/seed-workspace';
import type { AuthResponse, JwtPayload, PublicUser } from './auth.types';

/** Friendly display names so each guest session feels like a real account. */
const GUEST_ADJECTIVES = ['Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Sunny'];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Provisions a throwaway account. Each call yields a distinct user id, so two
   * guests on the same machine never see each other's data.
   */
  async loginAsGuest(displayName?: string): Promise<AuthResponse> {
    const adjective =
      GUEST_ADJECTIVES[Math.floor(Math.random() * GUEST_ADJECTIVES.length)];

    const user = await this.prisma.user.create({
      data: {
        name: displayName?.trim() || `${adjective} Guest`,
        isGuest: true,
      },
    });

    // Populate the workspace with the drawn sample data, so the first screen is
    // the design rather than an empty state. Scoped to this user's id, so two
    // guests still cannot see each other's copies.
    await seedWorkspace(this.prisma, user.id);

    return {
      accessToken: this.jwt.sign({ sub: user.id, isGuest: user.isGuest } satisfies JwtPayload),
      user: this.toPublicUser(user),
    };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return this.toPublicUser(user);
  }

  /** Resolves the JWT subject to a live user; the strategy calls this per request. */
  async validateUser(payload: JwtPayload): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return this.toPublicUser(user);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
    };
  }
}
