import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';

import { BallEvent } from './models/ball-event.model';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';
import { Player } from '../players/models/players.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Team } from '../teams/models/teams.model';
import { Rules } from '../tournament/models/rules.model';
import { MatchScorer } from '../match/models/match-scorer.model';
import { TournamentScorer } from '../tournament/models/tournament-scorer.model';

import { CreateBallEventDto } from './dtos/create-ball-event.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { successResponse } from 'src/common/utils/response.util';

import { Sequelize } from 'sequelize-typescript';
import { PointsTableService } from '../points-table/points-table.service';
import { ScoringGateway } from '../scoring-gateway/scoring.gateway';

@Injectable()
export class BallEventService {
  constructor(
    @InjectModel(BallEvent)
    private ballEventModel: typeof BallEvent,

    @InjectModel(Innings)
    private inningsModel: typeof Innings,

    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(Rules)
    private rulesModel: typeof Rules,

    @InjectModel(MatchScorer)
    private matchScorerModel: typeof MatchScorer,

    @InjectModel(TournamentScorer)
    private tournamentScorerModel: typeof TournamentScorer,

    private sequelize: Sequelize,

    private readonly pointsTableService: PointsTableService,

    private readonly scoringGateway: ScoringGateway,
  ) {}

  private get ballEventInclude() {
    return [
      { model: Player, as: 'striker', attributes: ['id', 'name'] },
      { model: Player, as: 'nonStriker', attributes: ['id', 'name'] },
      { model: Player, as: 'bowler', attributes: ['id', 'name'] },
      { model: Player, as: 'dismissedPlayer', attributes: ['id', 'name'] },
      { model: Player, as: 'fielder', attributes: ['id', 'name'] },
    ];
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

  async recordBall(
    dto: CreateBallEventDto,
    userId: number,
  ): Promise<SuccessResponse<{ ballEvent: BallEvent; innings: Innings }>> {
    const {
      innings_id,
      striker_id,
      non_striker_id,
      bowler_id,
      runs_bat,
      extra_type,
      runs_extra = 0,
      is_wicket = false,
      wicket_type,
      dismissed_player_id,
      fielder_id,
      metadata,
    } = dto;

    const innings = await this.inningsModel.findByPk(innings_id);
    if (!innings) {
      throw new NotFoundException('Innings not found');
    }
    if (innings.status !== 'in_progress') {
      throw new BadRequestException('Innings is not in progress');
    }

    const match = await this.matchModel.findByPk(innings.match_id);
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.status !== 'live') {
      throw new BadRequestException('Match is not live');
    }

    if (match.active_scorer_id !== userId) {
      if (match.active_scorer_id === null) {
        let isAuthorized = false;
        if (match.tournament_id) {
          const tournamentScorer = await this.tournamentScorerModel.findOne({
            where: { tournament_id: match.tournament_id, user_id: userId },
          });
          if (tournamentScorer) isAuthorized = true;
        } else {
          const matchScorer = await this.matchScorerModel.findOne({
            where: { match_id: match.id, user_id: userId },
          });
          if (matchScorer) isAuthorized = true;
        }

        if (match.created_by === userId) {
          isAuthorized = true;
        }

        if (!isAuthorized) {
          throw new ForbiddenException(
            'Only the current active scorer can update score events',
          );
        }

        await match.update({ active_scorer_id: userId });
      } else {
        throw new ForbiddenException(
          'Only the current active scorer can update score events',
        );
      }
    }

    await this.checkConcurrentSession(userId, match.id);

    const matchRules = await this.rulesModel.findOne({
      where: { match_id: innings.match_id },
    });
    const ignoreWideRule = matchRules?.ignore_wide_rule ?? false;
    const ignoreNoBallRule = matchRules?.ignore_no_ball_rule ?? false;

    let effectiveExtraType = extra_type;
    let effectiveRunsExtra = runs_extra;

    if (ignoreWideRule && effectiveExtraType === 'wide') {
      effectiveExtraType = undefined;
      effectiveRunsExtra = 0;
    }
    if (ignoreNoBallRule && effectiveExtraType === 'no_ball') {
      effectiveExtraType = undefined;
      effectiveRunsExtra = 0;
    }

    const ruleWideRuns = matchRules?.wide_runs ?? 1;
    const ruleNoBallRuns = matchRules?.no_ball_runs ?? 1;
    const countWideAsLegal = ignoreWideRule
      ? false
      : (matchRules?.count_wide_as_legal_delivery ?? false);
    const countNoBallAsLegal = ignoreNoBallRule
      ? false
      : (matchRules?.count_no_ball_as_legal_delivery ?? false);

    let computedRunsExtra = effectiveRunsExtra;
    if (effectiveExtraType === 'wide') {
      const additionalRuns = Math.max(0, effectiveRunsExtra - 1);
      computedRunsExtra = ruleWideRuns + additionalRuns;
    } else if (effectiveExtraType === 'no_ball') {
      computedRunsExtra = ruleNoBallRuns;
    }

    await this.validatePlayers(
      innings.batting_team_id,
      innings.bowling_team_id,
      striker_id,
      non_striker_id,
      bowler_id,
    );

    if (is_wicket && dismissed_player_id) {
      const dismissedInTeam = await this.teamPlayerModel.findOne({
        where: {
          team_id: innings.batting_team_id,
          player_id: dismissed_player_id,
        },
      });
      if (!dismissedInTeam) {
        throw new BadRequestException(
          'Dismissed player does not belong to the batting team',
        );
      }
    }

    if (fielder_id) {
      const fielderInTeam = await this.teamPlayerModel.findOne({
        where: {
          team_id: innings.bowling_team_id,
          player_id: fielder_id,
        },
      });
      if (!fielderInTeam) {
        throw new BadRequestException(
          'Fielder does not belong to the bowling team',
        );
      }
    }

    let isLegal =
      !effectiveExtraType ||
      effectiveExtraType === 'bye' ||
      effectiveExtraType === 'leg_bye';
    if (effectiveExtraType === 'wide' && countWideAsLegal) {
      isLegal = true;
    }
    if (effectiveExtraType === 'no_ball' && countNoBallAsLegal) {
      isLegal = true;
    }

    const overNumber = innings.overs;
    const ballNumber = isLegal ? innings.balls + 1 : innings.balls;

    const totalDeliveryRuns = runs_bat + computedRunsExtra;

    const result = await this.sequelize.transaction(async (transaction) => {
      const ballMetadata: Record<string, unknown> = {
        ...metadata,
      };
      if (is_wicket && wicket_type === 'run_out') {
        if (dto.runs_completed !== undefined) {
          ballMetadata.runs_completed = dto.runs_completed;
        }
        if (dto.batsmen_crossed !== undefined) {
          ballMetadata.batsmen_crossed = dto.batsmen_crossed;
        }
      }
      if (effectiveExtraType === 'wide') {
        ballMetadata.penalty_runs = ruleWideRuns;
      } else if (effectiveExtraType === 'no_ball') {
        ballMetadata.penalty_runs = ruleNoBallRuns;
      }

      const ballEvent = await this.ballEventModel.create(
        {
          innings_id,
          over_number: overNumber,
          ball_number: ballNumber,
          striker_id,
          non_striker_id,
          bowler_id,
          runs_bat,
          runs_extra: computedRunsExtra,
          extra_type: effectiveExtraType || null,
          is_wicket,
          wicket_type: wicket_type || null,
          dismissed_player_id: dismissed_player_id || null,
          fielder_id: fielder_id || null,
          is_legal: isLegal,
          metadata: Object.keys(ballMetadata).length > 0 ? ballMetadata : null,
        },
        { transaction },
      );

      const updateData: Partial<Innings> = {};

      updateData.total_runs = innings.total_runs + totalDeliveryRuns;

      let newBalls = innings.balls;
      let newOvers = innings.overs;
      if (isLegal) {
        newBalls += 1;
        if (newBalls === 6) {
          newOvers += 1;
          newBalls = 0;
        }
      }
      updateData.balls = newBalls;
      updateData.overs = newOvers;

      let newWickets = innings.wickets;
      if (is_wicket && wicket_type !== 'retired_hurt') {
        newWickets += 1;
      }
      updateData.wickets = newWickets;

      let newStrikerId = striker_id;
      let newNonStrikerId = non_striker_id;

      if (is_wicket && dismissed_player_id) {
        const strikerOut = dismissed_player_id === newStrikerId;
        const nonStrikerOut = dismissed_player_id === newNonStrikerId;

        if (strikerOut) {
          newStrikerId = null;
        } else if (nonStrikerOut) {
          newNonStrikerId = null;
        }

        if (wicket_type === 'run_out' && dto.batsmen_crossed) {
          if (strikerOut && newNonStrikerId) {
            newStrikerId = newNonStrikerId;
            newNonStrikerId = null;
          }
        }
      }

      if (extra_type === 'wide') {
        const runsRun = computedRunsExtra - ruleWideRuns;
        if (runsRun > 0 && runsRun % 2 !== 0) {
          [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
        }
      } else {
        if (runs_bat % 2 !== 0) {
          [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
        }
      }

      const isOverComplete = isLegal && newBalls === 0;
      if (isOverComplete) {
        if (newStrikerId === null) {
          newStrikerId = newNonStrikerId;
          newNonStrikerId = null;
        } else if (newNonStrikerId === null) {
        } else {
          [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
        }
      }

      updateData.striker_id = newStrikerId;
      updateData.non_striker_id = newNonStrikerId;

      if (isOverComplete) {
        updateData.bowler_id = null;
      } else {
        updateData.bowler_id = bowler_id;
      }

      const battingTeamPlayersCount = await this.teamPlayerModel.count({
        where: { team_id: innings.batting_team_id },
        transaction,
      });
      const effectiveMaxWickets = Math.min(
        innings.max_wickets,
        Math.max(0, battingTeamPlayersCount - 1),
      );

      const allOut = newWickets >= effectiveMaxWickets;
      const maxOvers = innings.is_super_over ? 1 : match.overs_per_side;
      const oversFinished = newOvers >= maxOvers && newBalls === 0;

      let targetChased = false;
      let firstInningsTotal: number | null = null;
      if (innings.innings_number === 2) {
        const firstInnings = await this.inningsModel.findOne({
          where: {
            match_id: innings.match_id,
            innings_number: 1,
          },
          transaction,
        });
        if (firstInnings) {
          firstInningsTotal = firstInnings.total_runs;
          if (updateData.total_runs! > firstInnings.total_runs) {
            targetChased = true;
          }
        }
      } else if (innings.is_super_over && innings.innings_number % 2 === 0) {
        const firstSuperOverInnings = await this.inningsModel.findOne({
          where: {
            match_id: innings.match_id,
            innings_number: innings.innings_number - 1,
            is_super_over: true,
            super_over_number: innings.super_over_number,
          },
          transaction,
        });
        if (firstSuperOverInnings) {
          firstInningsTotal = firstSuperOverInnings.total_runs;
          if (updateData.total_runs! > firstInningsTotal) {
            targetChased = true;
          }
        }
      }

      const isInningsComplete = allOut || oversFinished || targetChased;

      if (isInningsComplete) {
        updateData.status = 'completed';
      }

      await innings.update(updateData, { transaction });

      if (isInningsComplete) {
        if (innings.innings_number === 1) {
          await this.inningsModel.create(
            {
              match_id: innings.match_id,
              innings_number: 2,
              batting_team_id: innings.bowling_team_id,
              bowling_team_id: innings.batting_team_id,
              total_runs: 0,
              wickets: 0,
              overs: 0,
              balls: 0,
              status: 'not_started',
              max_wickets: 10,
            },
            { transaction },
          );
        } else if (innings.innings_number === 2 && firstInningsTotal !== null) {
          let winnerTeamId: number | null = null;
          let matchResult: 'win' | 'tie' | 'super_over' = 'win';

          if (targetChased) {
            winnerTeamId = innings.batting_team_id;
            matchResult = 'win';
          } else if (updateData.total_runs! < firstInningsTotal) {
            winnerTeamId = innings.bowling_team_id;
            matchResult = 'win';
          } else if (updateData.total_runs! === firstInningsTotal) {
            winnerTeamId = null;
            matchResult = 'super_over';
          }

          if (matchResult === 'super_over') {
            const chasingTeamId = innings.batting_team_id;
            const bowlingTeamId = innings.bowling_team_id;

            await this.inningsModel.create(
              {
                match_id: innings.match_id,
                innings_number: 3,
                batting_team_id: chasingTeamId,
                bowling_team_id: bowlingTeamId,
                total_runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                status: 'not_started',
                is_super_over: true,
                super_over_number: 1,
                max_wickets: 2,
              },
              { transaction },
            );

            await this.matchModel.update(
              {
                super_over_chasing_team_id: chasingTeamId,
              },
              {
                where: { id: match.id },
                transaction,
              },
            );
          }

          await this.matchModel.update(
            {
              status: matchResult === 'super_over' ? 'live' : 'completed',
              winner_team_id: winnerTeamId,
              result: matchResult,
              is_super_over: matchResult === 'super_over',
              super_over_number: matchResult === 'super_over' ? 1 : 0,
            },
            {
              where: { id: match.id },
              transaction,
            },
          );

          if (matchResult === 'win' && match.tournament_id) {
            await this.pointsTableService.updateFromMatch(
              match.id,
              transaction,
            );
          }
        } else if (innings.is_super_over && innings.innings_number >= 3) {
          await this.handleSuperOverCompletion(
            match,
            innings,
            updateData,
            transaction,
          );
        }
      }

      return ballEvent;
    });

    const ballEvent = await this.ballEventModel.findByPk(result.id, {
      include: this.ballEventInclude,
    });

    const updatedInnings = await this.inningsModel.findByPk(innings_id, {
      include: [
        { model: Team, as: 'battingTeam', attributes: ['id', 'name'] },
        { model: Team, as: 'bowlingTeam', attributes: ['id', 'name'] },
        { model: Player, as: 'striker', attributes: ['id', 'name'] },
        { model: Player, as: 'nonStriker', attributes: ['id', 'name'] },
        { model: Player, as: 'bowler', attributes: ['id', 'name'] },
      ],
    });

    return successResponse('Ball recorded successfully', {
      ballEvent,
      innings: updatedInnings,
    });
  }

  emitBallRecorded(
    matchId: number,
    ballEvent: BallEvent,
    innings: Innings,
    scorecard: unknown,
  ) {
    this.scoringGateway.emitToMatch(matchId, 'ball:recorded', {
      ballEvent,
      innings,
      scorecard,
    });
  }

  emitBallUndone(
    matchId: number,
    innings: Innings,
    removedEventId: number,
    scorecard: unknown,
  ) {
    this.scoringGateway.emitToMatch(matchId, 'ball:undone', {
      innings,
      removedEventId,
      scorecard,
    });
  }

  async findByInnings(
    inningsId: number,
  ): Promise<SuccessResponse<BallEvent[]>> {
    const innings = await this.inningsModel.findByPk(inningsId);
    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    const events = await this.ballEventModel.findAll({
      where: { innings_id: inningsId },
      order: [
        ['over_number', 'ASC'],
        ['ball_number', 'ASC'],
        ['id', 'ASC'],
      ],
      include: this.ballEventInclude,
    });

    return successResponse('Ball events retrieved successfully', events);
  }

  async findOne(id: number): Promise<SuccessResponse<BallEvent>> {
    const event = await this.ballEventModel.findByPk(id, {
      include: this.ballEventInclude,
    });

    if (!event) {
      throw new NotFoundException('Ball event not found');
    }

    return successResponse('Ball event retrieved successfully', event);
  }

  async undoLast(
    inningsId: number,
    userId: number,
  ): Promise<SuccessResponse<{ innings: Innings }>> {
    const innings = await this.inningsModel.findByPk(inningsId);
    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    const match = await this.matchModel.findByPk(innings.match_id);
    if (match && match.active_scorer_id !== userId) {
      if (match.active_scorer_id === null) {
        let isAuthorized = false;
        if (match.tournament_id) {
          const tournamentScorer = await this.tournamentScorerModel.findOne({
            where: { tournament_id: match.tournament_id, user_id: userId },
          });
          if (tournamentScorer) isAuthorized = true;
        } else {
          const matchScorer = await this.matchScorerModel.findOne({
            where: { match_id: match.id, user_id: userId },
          });
          if (matchScorer) isAuthorized = true;
        }

        if (match.created_by === userId) {
          isAuthorized = true;
        }

        if (!isAuthorized) {
          throw new ForbiddenException(
            'Only the current active scorer can update score events',
          );
        }

        await match.update({ active_scorer_id: userId });
      } else {
        throw new ForbiddenException(
          'Only the current active scorer can update score events',
        );
      }
    }

    if (match) {
      await this.checkConcurrentSession(userId, match.id);
    }

    const lastEvent = await this.ballEventModel.findOne({
      where: { innings_id: inningsId },
      order: [['id', 'DESC']],
    });

    if (!lastEvent) {
      throw new BadRequestException('No ball events to undo');
    }

    await this.sequelize.transaction(async (transaction) => {
      const totalDeliveryRuns = lastEvent.runs_bat + lastEvent.runs_extra;

      const updateData: Partial<Innings> = {};

      updateData.total_runs = innings.total_runs - totalDeliveryRuns;

      if (lastEvent.is_legal) {
        if (innings.balls === 0) {
          updateData.overs = innings.overs - 1;
          updateData.balls = 5;
        } else {
          updateData.overs = innings.overs;
          updateData.balls = innings.balls - 1;
        }
      } else {
        updateData.overs = innings.overs;
        updateData.balls = innings.balls;
      }

      if (lastEvent.is_wicket && lastEvent.wicket_type !== 'retired_hurt') {
        updateData.wickets = innings.wickets - 1;
      }

      updateData.striker_id = lastEvent.striker_id;
      updateData.non_striker_id = lastEvent.non_striker_id;
      updateData.bowler_id = lastEvent.bowler_id;

      const wasCompleted = innings.status === 'completed';

      if (wasCompleted) {
        updateData.status = 'in_progress';
      }

      await innings.update(updateData, { transaction });
      await lastEvent.destroy({ transaction });

      if (wasCompleted) {
        const subsequentInnings = await this.inningsModel.findAll({
          where: {
            match_id: innings.match_id,
            innings_number: { [Op.gt]: innings.innings_number },
          },
          transaction,
        });

        for (const subInnings of subsequentInnings) {
          if (subInnings.status !== 'not_started') {
            throw new BadRequestException(
              'Cannot undo: A subsequent innings has already started.',
            );
          }
        }

        for (const subInnings of subsequentInnings) {
          await this.ballEventModel.destroy({
            where: { innings_id: subInnings.id },
            transaction,
          });
          await subInnings.destroy({ transaction });
        }

        if (innings.innings_number >= 2) {
          if (match && match.tournament_id) {
            await this.pointsTableService.reverseFromMatch(
              innings.match_id,
              transaction,
            );
          }

          await this.matchModel.update(
            {
              status: 'live',
              winner_team_id: null,
              result: innings.is_super_over ? 'super_over' : null,
              is_super_over: innings.is_super_over,
              super_over_number: innings.is_super_over
                ? innings.super_over_number
                : 0,
            },
            {
              where: { id: innings.match_id },
              transaction,
            },
          );
        }
      }
    });

    const updatedInnings = await this.inningsModel.findByPk(inningsId, {
      include: [
        { model: Team, as: 'battingTeam', attributes: ['id', 'name'] },
        { model: Team, as: 'bowlingTeam', attributes: ['id', 'name'] },
        { model: Player, as: 'striker', attributes: ['id', 'name'] },
        { model: Player, as: 'nonStriker', attributes: ['id', 'name'] },
        { model: Player, as: 'bowler', attributes: ['id', 'name'] },
      ],
    });

    return successResponse('Last ball event undone successfully', {
      innings: updatedInnings,
    });
  }

  async getScorecard(inningsId: number): Promise<
    SuccessResponse<{
      batting: Array<{
        player_id: number;
        player_name: string;
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        strike_rate: number;
        is_out: boolean;
        wicket_type: string | null;
        bowler_name: string | null;
        fielder_name: string | null;
      }>;
      bowling: Array<{
        player_id: number;
        player_name: string;
        overs: string;
        maidens: number;
        runs_conceded: number;
        wickets: number;
        economy: number;
        extras: number;
      }>;
      extras: {
        wides: number;
        no_balls: number;
        byes: number;
        leg_byes: number;
        total: number;
      };
    }>
  > {
    const innings = await this.inningsModel.findByPk(inningsId, {
      include: [
        { model: Player, as: 'striker', attributes: ['id', 'name'] },
        { model: Player, as: 'nonStriker', attributes: ['id', 'name'] },
        { model: Player, as: 'bowler', attributes: ['id', 'name'] },
      ],
    });
    if (!innings) {
      throw new NotFoundException('Innings not found');
    }

    const events = await this.ballEventModel.findAll({
      where: { innings_id: inningsId },
      order: [['id', 'ASC']],
      include: this.ballEventInclude,
    });

    const battersMap = new Map<
      number,
      {
        player_id: number;
        player_name: string;
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        is_out: boolean;
        wicket_type: string | null;
        bowler_name: string | null;
        fielder_name: string | null;
      }
    >();

    const bowlersMap = new Map<
      number,
      {
        player_id: number;
        player_name: string;
        legal_balls: number;
        runs_conceded: number;
        wickets: number;
        extras: number;
        overs_balls: Map<number, number[]>;
      }
    >();

    const extras = { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, total: 0 };

    if (innings.striker_id) {
      battersMap.set(innings.striker_id, {
        player_id: innings.striker_id,
        player_name: innings.striker?.name || `Player ${innings.striker_id}`,
        runs: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        is_out: false,
        wicket_type: null,
        bowler_name: null,
        fielder_name: null,
      });
    }

    if (innings.non_striker_id) {
      battersMap.set(innings.non_striker_id, {
        player_id: innings.non_striker_id,
        player_name:
          innings.nonStriker?.name || `Player ${innings.non_striker_id}`,
        runs: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        is_out: false,
        wicket_type: null,
        bowler_name: null,
        fielder_name: null,
      });
    }

    if (innings.bowler_id) {
      bowlersMap.set(innings.bowler_id, {
        player_id: innings.bowler_id,
        player_name: innings.bowler?.name || `Player ${innings.bowler_id}`,
        legal_balls: 0,
        runs_conceded: 0,
        wickets: 0,
        extras: 0,
        overs_balls: new Map(),
      });
    }

    for (const event of events) {
      const strikerId = event.striker_id;
      if (!battersMap.has(strikerId)) {
        battersMap.set(strikerId, {
          player_id: strikerId,
          player_name: event.striker?.name || `Player ${strikerId}`,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          is_out: false,
          wicket_type: null,
          bowler_name: null,
          fielder_name: null,
        });
      }

      const nonStrikerId = event.non_striker_id;
      if (!battersMap.has(nonStrikerId)) {
        battersMap.set(nonStrikerId, {
          player_id: nonStrikerId,
          player_name: event.nonStriker?.name || `Player ${nonStrikerId}`,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          is_out: false,
          wicket_type: null,
          bowler_name: null,
          fielder_name: null,
        });
      }

      const striker = battersMap.get(strikerId)!;
      striker.is_out = false;
      striker.wicket_type = null;
      striker.bowler_name = null;
      striker.fielder_name = null;

      const nonStriker = battersMap.get(nonStrikerId)!;
      nonStriker.is_out = false;
      nonStriker.wicket_type = null;
      nonStriker.bowler_name = null;
      nonStriker.fielder_name = null;

      const batter = striker;

      if (event.extra_type !== 'wide') {
        batter.balls_faced += 1;
      }

      batter.runs += event.runs_bat;
      if (event.runs_bat === 4) batter.fours += 1;
      if (event.runs_bat === 6) batter.sixes += 1;

      if (event.is_wicket && event.dismissed_player_id) {
        if (!battersMap.has(event.dismissed_player_id)) {
          battersMap.set(event.dismissed_player_id, {
            player_id: event.dismissed_player_id,
            player_name:
              event.dismissedPlayer?.name ||
              `Player ${event.dismissed_player_id}`,
            runs: 0,
            balls_faced: 0,
            fours: 0,
            sixes: 0,
            is_out: false,
            wicket_type: null,
            bowler_name: null,
            fielder_name: null,
          });
        }
        const dismissed = battersMap.get(event.dismissed_player_id)!;
        dismissed.is_out = true;
        dismissed.wicket_type = event.wicket_type;
        dismissed.bowler_name = event.bowler?.name || null;
        dismissed.fielder_name = event.fielder?.name || null;
      }

      const bowlerId = event.bowler_id;
      if (!bowlersMap.has(bowlerId)) {
        bowlersMap.set(bowlerId, {
          player_id: bowlerId,
          player_name: event.bowler?.name || `Player ${bowlerId}`,
          legal_balls: 0,
          runs_conceded: 0,
          wickets: 0,
          extras: 0,
          overs_balls: new Map(),
        });
      }
      const bowlerStats = bowlersMap.get(bowlerId)!;

      if (event.is_legal) {
        bowlerStats.legal_balls += 1;
      }

      bowlerStats.runs_conceded += event.runs_bat;
      if (event.extra_type === 'wide' || event.extra_type === 'no_ball') {
        bowlerStats.runs_conceded += event.runs_extra;
        bowlerStats.extras += event.runs_extra;
      }

      if (
        event.is_wicket &&
        event.wicket_type !== 'run_out' &&
        event.wicket_type !== 'retired_hurt'
      ) {
        bowlerStats.wickets += 1;
      }

      if (event.is_legal) {
        if (!bowlerStats.overs_balls.has(event.over_number)) {
          bowlerStats.overs_balls.set(event.over_number, []);
        }
        bowlerStats.overs_balls
          .get(event.over_number)!
          .push(event.runs_bat + event.runs_extra);
      }

      if (event.extra_type === 'wide') {
        extras.wides += event.runs_extra;
      } else if (event.extra_type === 'no_ball') {
        extras.no_balls += event.runs_extra;
      } else if (event.extra_type === 'bye') {
        extras.byes += event.runs_extra;
      } else if (event.extra_type === 'leg_bye') {
        extras.leg_byes += event.runs_extra;
      }
    }

    extras.total =
      extras.wides + extras.no_balls + extras.byes + extras.leg_byes;

    const batting = Array.from(battersMap.values()).map((b) => ({
      ...b,
      strike_rate:
        b.balls_faced > 0
          ? parseFloat(((b.runs / b.balls_faced) * 100).toFixed(2))
          : 0,
    }));

    const bowling = Array.from(bowlersMap.values()).map((b) => {
      const completedOvers = Math.floor(b.legal_balls / 6);
      const remainingBalls = b.legal_balls % 6;
      const oversStr = `${completedOvers}.${remainingBalls}`;
      const totalOversDecimal = b.legal_balls / 6;

      let maidens = 0;
      b.overs_balls.forEach((balls) => {
        if (balls.length === 6 && balls.every((r) => r === 0)) {
          maidens += 1;
        }
      });

      return {
        player_id: b.player_id,
        player_name: b.player_name,
        overs: oversStr,
        maidens,
        runs_conceded: b.runs_conceded,
        wickets: b.wickets,
        economy:
          totalOversDecimal > 0
            ? parseFloat((b.runs_conceded / totalOversDecimal).toFixed(2))
            : 0,
        extras: b.extras,
      };
    });

    return successResponse('Scorecard generated successfully', {
      batting,
      bowling,
      extras,
    });
  }

  private async validatePlayers(
    battingTeamId: number,
    bowlingTeamId: number,
    strikerId: number,
    nonStrikerId: number,
    bowlerId: number,
  ) {
    if (strikerId === nonStrikerId) {
      throw new BadRequestException(
        'Striker and non-striker cannot be the same player',
      );
    }

    const strikerInTeam = await this.teamPlayerModel.findOne({
      where: { team_id: battingTeamId, player_id: strikerId },
    });
    if (!strikerInTeam) {
      throw new BadRequestException(
        'Striker does not belong to the batting team',
      );
    }

    const nonStrikerInTeam = await this.teamPlayerModel.findOne({
      where: { team_id: battingTeamId, player_id: nonStrikerId },
    });
    if (!nonStrikerInTeam) {
      throw new BadRequestException(
        'Non-striker does not belong to the batting team',
      );
    }

    const bowlerInTeam = await this.teamPlayerModel.findOne({
      where: { team_id: bowlingTeamId, player_id: bowlerId },
    });
    if (!bowlerInTeam) {
      throw new BadRequestException(
        'Bowler does not belong to the bowling team',
      );
    }
  }

  private async handleSuperOverCompletion(
    match: Match,
    currentInnings: Innings,
    updateData: Partial<Innings>,
    transaction: Transaction,
  ): Promise<void> {
    const superOverNumber = currentInnings.super_over_number;

    const chasingTeamId = match.super_over_chasing_team_id;
    const otherTeamId =
      chasingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

    if (currentInnings.innings_number % 2 === 1) {
      await this.inningsModel.create(
        {
          match_id: match.id,
          innings_number: currentInnings.innings_number + 1,
          batting_team_id: otherTeamId,
          bowling_team_id: chasingTeamId,
          total_runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          status: 'not_started',
          is_super_over: true,
          super_over_number: superOverNumber,
          max_wickets: 2,
        },
        { transaction },
      );
    } else {
      const superOverInnings = await this.inningsModel.findAll({
        where: {
          match_id: match.id,
          is_super_over: true,
          super_over_number: superOverNumber,
        },
        transaction,
      });

      const firstSuperOverInnings = superOverInnings.find(
        (i) => i.batting_team_id === chasingTeamId,
      );

      if (firstSuperOverInnings) {
        const chasingTeamRuns = firstSuperOverInnings.total_runs;
        const otherTeamRuns =
          updateData.total_runs ?? currentInnings.total_runs;

        const currentBattingTeamId = currentInnings.batting_team_id;

        if (otherTeamRuns > chasingTeamRuns) {
          await this.matchModel.update(
            {
              status: 'completed',
              winner_team_id: currentBattingTeamId,
              result: 'win',
            },
            {
              where: { id: match.id },
              transaction,
            },
          );
          if (match.tournament_id) {
            await this.pointsTableService.updateFromMatch(
              match.id,
              transaction,
            );
          }
        } else if (otherTeamRuns < chasingTeamRuns) {
          await this.matchModel.update(
            {
              status: 'completed',
              winner_team_id: chasingTeamId,
              result: 'win',
            },
            {
              where: { id: match.id },
              transaction,
            },
          );
          if (match.tournament_id) {
            await this.pointsTableService.updateFromMatch(
              match.id,
              transaction,
            );
          }
        } else {
          if (superOverNumber >= 2) {
            await this.matchModel.update(
              {
                status: 'completed',
                winner_team_id: null,
                result: 'draw',
              },
              {
                where: { id: match.id },
                transaction,
              },
            );
            if (match.tournament_id) {
              await this.pointsTableService.updateFromMatch(
                match.id,
                transaction,
              );
            }
          } else {
            const newSuperOverNumber = superOverNumber + 1;

            await this.inningsModel.create(
              {
                match_id: match.id,
                innings_number: currentInnings.innings_number + 1,
                batting_team_id: chasingTeamId,
                bowling_team_id: otherTeamId,
                total_runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                status: 'not_started',
                is_super_over: true,
                super_over_number: newSuperOverNumber,
                max_wickets: 2,
              },
              { transaction },
            );

            await this.matchModel.update(
              {
                super_over_number: newSuperOverNumber,
              },
              {
                where: { id: match.id },
                transaction,
              },
            );
          }
        }
      }
    }
  }
}
