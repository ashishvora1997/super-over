import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { InningsService } from './innings.service';
import { StartInningsDto } from './dtos/start-innings.dto';
import { UpdateInningsPlayersDto } from './dtos/update-innings-players.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('innings')
export class InningsController {
  constructor(private readonly inningsService: InningsService) {}

  @Post(':id/start')
  async start(
    @Param('id') id: number,
    @Body() dto: StartInningsDto,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.inningsService.start(
      Number(id),
      dto,
      req.user.id,
    );
    const innings = result.data;

    this.inningsService.emitInningsStarted(innings.match_id, innings);

    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.inningsService.findOne(Number(id));
  }

  @Get('match/:matchId')
  findByMatch(@Param('matchId') matchId: number) {
    return this.inningsService.findByMatch(Number(matchId));
  }

  @Patch(':id/players')
  async updatePlayers(
    @Param('id') id: number,
    @Body() dto: UpdateInningsPlayersDto,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.inningsService.updatePlayers(
      Number(id),
      dto,
      req.user.id,
    );
    const innings = result.data;

    this.inningsService.emitInningsPlayersUpdated(innings.match_id, innings);

    return result;
  }
}
