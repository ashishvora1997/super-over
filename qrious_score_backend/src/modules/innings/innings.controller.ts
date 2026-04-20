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
  start(@Param('id') id: number, @Body() dto: StartInningsDto) {
    return this.inningsService.start(Number(id), dto);
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
  updatePlayers(@Param('id') id: number, @Body() dto: UpdateInningsPlayersDto) {
    return this.inningsService.updatePlayers(Number(id), dto);
  }
}
