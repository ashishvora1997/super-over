import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { InningsService } from './innings.service';
import { StartInningsDto } from './dtos/start-innings.dto';
import { UpdateInningsPlayersDto } from './dtos/update-innings-players.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('innings')
export class InningsController {
  constructor(private readonly inningsService: InningsService) {}

  @Roles('admin', 'scorer')
  @Post(':id/start')
  async start(@Param('id') id: number, @Body() dto: StartInningsDto) {
    const result = await this.inningsService.start(Number(id), dto);
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

  @Roles('admin', 'scorer')
  @Patch(':id/players')
  async updatePlayers(
    @Param('id') id: number,
    @Body() dto: UpdateInningsPlayersDto,
  ) {
    const result = await this.inningsService.updatePlayers(Number(id), dto);
    const innings = result.data;

    this.inningsService.emitInningsPlayersUpdated(innings.match_id, innings);

    return result;
  }
}
