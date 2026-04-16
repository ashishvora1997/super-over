import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { TossService } from './toss.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTossDto } from './dtos/create-toss.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matches/:matchId/toss')
export class TossController {
  constructor(private readonly tossService: TossService) {}

  @Roles('admin', 'scorer')
  @Post()
  create(@Param('matchId') matchId: number, @Body() dto: CreateTossDto) {
    return this.tossService.create(Number(matchId), dto);
  }

  @Get()
  findByMatch(@Param('matchId') matchId: number) {
    return this.tossService.findByMatch(Number(matchId));
  }
}
