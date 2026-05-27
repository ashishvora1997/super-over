import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { PointsTableService } from './points-table.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('points-table')
export class PointsTableController {
  constructor(private readonly pointsTableService: PointsTableService) {}

  @Get(':tournamentId')
  getStandings(@Param('tournamentId') tournamentId: number) {
    return this.pointsTableService.getStandings(Number(tournamentId));
  }
}
