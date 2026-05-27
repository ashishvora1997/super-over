import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { TossService } from './toss.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateTossDto } from './dtos/create-toss.dto';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('matches/:matchId/toss')
export class TossController {
  constructor(private readonly tossService: TossService) {}

  @Post()
  create(
    @Param('matchId') matchId: number,
    @Body() dto: CreateTossDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tossService.create(Number(matchId), dto, req.user.id);
  }

  @Get()
  findByMatch(@Param('matchId') matchId: number) {
    return this.tossService.findByMatch(Number(matchId));
  }
}
