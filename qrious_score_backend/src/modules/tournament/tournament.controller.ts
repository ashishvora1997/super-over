import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { TournamentService } from './tournament.service';

import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { AssignTeamsDto } from './dtos/assign-teams.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Post()
  create(@Body() dto: CreateTournamentDto) {
    console.log('from the frontend:', dto);
    return this.tournamentService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tournamentService.findAll(
      search,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tournamentService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateTournamentDto) {
    return this.tournamentService.update(Number(id), dto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.tournamentService.delete(Number(id));
  }

  @Post('assign-teams')
  assignTeams(@Body() dto: AssignTeamsDto) {
    return this.tournamentService.assignTeams(dto);
  }
}
