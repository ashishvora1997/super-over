import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req) {
    return this.userService.getCurrentUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me/dashboard')
  getDashboardData(@Request() req) {
    return this.userService.getDashboardData(String(req.user.id));
  }
}
