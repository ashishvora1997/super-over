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
  Req,
} from '@nestjs/common';

import { TournamentService } from './tournament.service';

import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { AssignTeamsDto } from './dtos/assign-teams.dto';
import { UpsertRulesDto } from './dtos/upsert-rules.dto';
import { AddScorerDto } from './dtos/add-scorer.dto';
import { RemoveScorerDto } from './dtos/remove-scorer.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Post()
  create(@Body() dto: CreateTournamentDto, @Req() req: RequestWithUser) {
    dto.created_by = req.user.id;
    return this.tournamentService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Req() req?: RequestWithUser,
  ) {
    return this.tournamentService.findAll(
      search,
      Number(page) || 1,
      Number(limit) || 10,
      req?.user?.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tournamentService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() dto: UpdateTournamentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tournamentService.update(Number(id), dto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: number, @Req() req: RequestWithUser) {
    return this.tournamentService.delete(Number(id), req.user.id);
  }

  @Post('assign-teams')
  assignTeams(@Body() dto: AssignTeamsDto) {
    return this.tournamentService.assignTeams(dto);
  }

  @Delete(':id/teams/:teamId')
  removeTeam(
    @Param('id') id: number,
    @Param('teamId') teamId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.tournamentService.removeTeam(
      Number(id),
      Number(teamId),
      req.user.id,
    );
  }

  @Get(':id/rules')
  getRules(@Param('id') id: number) {
    return this.tournamentService.getRules(Number(id));
  }

  @Post('rules')
  upsertRules(@Body() dto: UpsertRulesDto, @Req() req: RequestWithUser) {
    return this.tournamentService.upsertRules(dto, req.user.id);
  }

  @Get(':id/scorers')
  getScorers(@Param('id') id: number) {
    return this.tournamentService.getScorers(Number(id));
  }

  @Post('scorers/add')
  addScorer(@Body() dto: AddScorerDto, @Req() req: RequestWithUser) {
    return this.tournamentService.addScorer(dto, req.user.id);
  }

  @Post('scorers/remove')
  removeScorer(@Body() dto: RemoveScorerDto, @Req() req: RequestWithUser) {
    return this.tournamentService.removeScorer(dto, req.user.id);
  }
}
