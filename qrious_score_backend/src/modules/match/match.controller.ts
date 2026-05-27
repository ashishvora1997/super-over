import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { MatchService } from './match.service';
import { CreateMatchDto } from './dtos/create-match.dto';
import { UpdateMatchDto } from './dtos/update-match.dto';
import { UpdateMatchRulesDto } from './dtos/update-match-rules.dto';
import { AddMatchScorerDto } from './dtos/add-match-scorer.dto';
import { RemoveMatchScorerDto } from './dtos/remove-match-scorer.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  create(@Body() dto: CreateMatchDto, @Req() req: RequestWithUser) {
    dto.created_by = req.user.id;
    return this.matchService.create(dto);
  }

  @Get()
  findAll(
    @Query('tournament_id') tournament_id?: number,
    @Req() req?: RequestWithUser,
  ) {
    return this.matchService.findAll(
      tournament_id ? Number(tournament_id) : undefined,
      req?.user?.id,
    );
  }

  @Get('list')
  findMatchesList() {
    return this.matchService.findAllMatchesList();
  }

  @Get('active-session')
  getActiveScoringSession(@Req() req: RequestWithUser) {
    return this.matchService.getActiveScoringSession(req.user.id);
  }

  @Post('scorers/add')
  addScorer(@Body() dto: AddMatchScorerDto, @Req() req: RequestWithUser) {
    return this.matchService.addScorer(dto, req.user.id);
  }

  @Post('scorers/remove')
  removeScorer(@Body() dto: RemoveMatchScorerDto, @Req() req: RequestWithUser) {
    return this.matchService.removeScorer(dto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.matchService.findOne(Number(id));
  }

  @Get(':id/rules')
  getMatchRules(@Param('id') id: number) {
    return this.matchService.getMatchRules(Number(id));
  }

  @Patch(':id/rules')
  updateMatchRules(
    @Param('id') id: number,
    @Body() dto: UpdateMatchRulesDto,
    @Req() req: RequestWithUser,
  ) {
    return this.matchService.updateMatchRules(Number(id), dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() dto: UpdateMatchDto,
    @Req() req: RequestWithUser,
  ) {
    return this.matchService.update(Number(id), dto, req.user.id);
  }

  @Post(':id/takeover')
  takeoverScoring(@Param('id') id: number, @Req() req: RequestWithUser) {
    return this.matchService.takeoverScoring(Number(id), req.user.id);
  }

  @Post(':id/transfer')
  transferScoring(
    @Param('id') id: number,
    @Body('target_user_id') targetUserId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.matchService.transferScoring(
      Number(id),
      req.user.id,
      Number(targetUserId),
    );
  }

  @Get(':id/scorers')
  getScorers(@Param('id') id: number) {
    return this.matchService.getScorers(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: number, @Req() req: RequestWithUser) {
    return this.matchService.delete(Number(id), req.user.id);
  }
}
