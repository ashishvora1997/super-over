import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { AssignPlayersDto } from './dtos/assign-players.dto';
import { FindTeamsQuery } from './interfaces/find-teams-query.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() data: CreateTeamDto) {
    return this.teamsService.create(data);
  }

  @Get()
  findAll(@Query() query: FindTeamsQuery) {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.teamsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() data: UpdateTeamDto) {
    return this.teamsService.update(Number(id), data);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.teamsService.delete(Number(id));
  }

  @Post('assign-players')
  assignPlayers(@Body() data: AssignPlayersDto) {
    return this.teamsService.assignPlayers(data);
  }
}
