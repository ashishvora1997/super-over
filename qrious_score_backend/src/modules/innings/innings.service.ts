import { InjectModel } from '@nestjs/sequelize';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';

import { Innings } from './models/innings.model';
import { Toss } from '../toss/models/toss.model';
import { Match } from '../match/models/match.model';
import { Team } from '../teams/models/teams.model';
import { Player } from '../players/models/players.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { MatchScorer } from '../match/models/match-scorer.model';
import { TournamentScorer } from '../tournament/models/tournament-scorer.model';

import { StartInningsDto } from './dtos/start-innings.dto';
import { UpdateInningsPlayersDto } from './dtos/update-innings-players.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { successResponse } from 'src/common/utils/response.util';
import { ScoringGateway } from '../scoring-gateway/scoring.gateway';

@Injectable()
export class InningsService {
  constructor(
    @InjectModel(Innings)
    private inningsModel: typeof Innings,

    @InjectModel(Toss)
    private tossModel: typeof Toss,

    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(MatchScorer)
    private matchScorerModel: typeof MatchScorer,

    @InjectModel(TournamentScorer)
    private tournamentScorerModel: typeof TournamentScorer,

    private readonly scoringGateway: ScoringGateway,
  ) {}

  private async validateScorerAuthority(
    match: Match,
    userId: number,
  ): Promise<void> {
    if (match.active_scorer_id === userId) return;

    if (match.active_scorer_id !== null) {
      throw new ForbiddenException(
        'Only the current active scorer can update score events',
      );
    }

    let isAuthorized = false;

    if (match.created_by === userId) isAuthorized = true;

    if (!isAuthorized && match.tournament_id) {
      const ts = await this.tournamentScorerModel.findOne({
        where: { tournament_id: match.tournament_id, user_id: userId },
      });
      if (ts) isAuthorized = true;
    }

    if (!isAuthorized && !match.tournament_id) {
      const ms = await this.matchScorerModel.findOne({
        where: { match_id: match.id, user_id: userId },
      });
      if (ms) isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to score this match',
      );
    }

    await this.checkConcurrentSession(userId, match.id);

    await match.update({ active_scorer_id: userId });
  }

  private async checkConcurrentSession(
    userId: number,
    currentMatchId: number,
  ): Promise<void> {
    const conflicting = await this.matchModel.findOne({
      where: {
        active_scorer_id: userId,
        status: 'live',
        id: { [Op.ne]: currentMatchId },
      },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: Team, as: 'teamB', attributes: ['id', 'name'] },
      ],
    });

    if (conflicting) {
      const a = conflicting.teamA?.name || 'Team A';
      const b = conflicting.teamB?.name || 'Team B';
      throw new BadRequestException(
        `You are currently the active scorer for a live match (${a} vs ${b}). Please transfer scoring access or complete that match before scoring another one.`,
      );
    }
  }

  private async validateBattingPlayers(
    battingTeamId: number,
    bowlingTeamId: number,
    strikerId: number | null,
    nonStrikerId: number | null,
    bowlerId: number | null,
  ) {
    if (strikerId && nonStrikerId && strikerId === nonStrikerId) {
      throw new BadRequestException(
        'Striker and non-striker cannot be the same player',
      );
    }

    if (strikerId) {
      const strikerInTeam = await this.teamPlayerModel.findOne({
        where: { team_id: battingTeamId, player_id: strikerId },
      });
      if (!strikerInTeam) {
        throw new BadRequestException(
          'Striker does not belong to the batting team',
        );
      }
    }

    if (nonStrikerId) {
      const nonStrikerInTeam = await this.teamPlayerModel.findOne({
        where: { team_id: battingTeamId, player_id: nonStrikerId },
      });
      if (!nonStrikerInTeam) {
        throw new BadRequestException(
          'Non-striker does not belong to the batting team',
        );
      }
    }

    if (bowlerId) {
      const bowlerInTeam = await this.teamPlayerModel.findOne({
        where: { team_id: bowlingTeamId, player_id: bowlerId },
      });
      if (!bowlerInTeam) {
        throw new BadRequestException(
          'Bowler does not belong to the bowling team',
        );
      }
    }
  }

  private get inningsInclude() {
    return [
      { model: Team, as: 'battingTeam', attributes: ['id', 'name'] },
      { model: Team, as: 'bowlingTeam', attributes: ['id', 'name'] },
      { model: Player, as: 'striker', attributes: ['id', 'name'] },
      { model: Player, as: 'nonStriker', attributes: ['id', 'name'] },
      { model: Player, as: 'bowler', attributes: ['id', 'name'] },
    ];
  }

  async start(
    inningsId: number,
    dto: StartInningsDto,
    userId: number,
  ): Promise<SuccessResponse<Innings>> {
    const innings = await this.inningsModel.findByPk(inningsId);

    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    const match = await this.matchModel.findByPk(innings.match_id);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.validateScorerAuthority(match, userId);

    if (innings.status === 'in_progress') {
      throw new BadRequestException('Innings has already started');
    }

    if (innings.status === 'completed') {
      throw new BadRequestException('Innings is already completed');
    }

    const toss = await this.tossModel.findOne({
      where: { match_id: innings.match_id },
    });

    if (!toss) {
      throw new BadRequestException(
        'Toss must be recorded before starting innings',
      );
    }

    const { striker_id, non_striker_id, bowler_id } = dto;

    await this.validateBattingPlayers(
      innings.batting_team_id,
      innings.bowling_team_id,
      striker_id,
      non_striker_id,
      bowler_id,
    );

    await innings.update({
      striker_id,
      non_striker_id,
      bowler_id,
      status: 'in_progress',
    });

    const updated = await this.inningsModel.findByPk(inningsId, {
      include: this.inningsInclude,
    });

    return successResponse('Innings started successfully', updated);
  }

  async findOne(inningsId: number): Promise<SuccessResponse<Innings>> {
    const innings = await this.inningsModel.findByPk(inningsId, {
      include: this.inningsInclude,
    });

    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    return successResponse('Innings retrieved successfully', innings);
  }

  async findByMatch(matchId: number): Promise<SuccessResponse<Innings[]>> {
    const match = await this.matchModel.findByPk(matchId);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const innings = await this.inningsModel.findAll({
      where: { match_id: matchId },
      order: [['innings_number', 'ASC']],
      include: this.inningsInclude,
    });

    return successResponse('Innings retrieved successfully', innings);
  }

  async updatePlayers(
    inningsId: number,
    dto: UpdateInningsPlayersDto,
    userId: number,
  ): Promise<SuccessResponse<Innings>> {
    const innings = await this.inningsModel.findByPk(inningsId);

    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    const match = await this.matchModel.findByPk(innings.match_id);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.validateScorerAuthority(match, userId);

    if (innings.status !== 'in_progress') {
      throw new BadRequestException(
        'Can only update players for an in-progress innings',
      );
    }

    const strikerId = dto.striker_id ?? innings.striker_id;
    const nonStrikerId = dto.non_striker_id ?? innings.non_striker_id;
    const bowlerId = dto.bowler_id ?? innings.bowler_id;

    await this.validateBattingPlayers(
      innings.batting_team_id,
      innings.bowling_team_id,
      strikerId,
      nonStrikerId,
      bowlerId,
    );

    await innings.update(dto);

    const updated = await this.inningsModel.findByPk(inningsId, {
      include: this.inningsInclude,
    });

    return successResponse('Innings players updated successfully', updated);
  }

  emitInningsStarted(matchId: number, innings: Innings) {
    this.scoringGateway.emitToMatch(matchId, 'innings:started', { innings });
  }

  emitInningsPlayersUpdated(matchId: number, innings: Innings) {
    this.scoringGateway.emitToMatch(matchId, 'innings:playersUpdated', {
      innings,
    });
  }
}
