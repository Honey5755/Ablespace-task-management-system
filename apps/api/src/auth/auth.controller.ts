import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { GuestLoginDto } from './dto/guest-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthResponse, PublicUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  loginAsGuest(@Body() dto: GuestLoginDto): Promise<AuthResponse> {
    return this.auth.loginAsGuest(dto.name);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: PublicUser): Promise<PublicUser> {
    return this.auth.getProfile(user.id);
  }
}
