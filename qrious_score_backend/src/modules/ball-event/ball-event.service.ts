import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { BallEvent } from './models/ball-event.model';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';
import { Player } from '../players/models/players.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Team } from '../teams/models/teams.model';
import { CreateBallEventDto } from './dtos/create-ball-event.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { successResponse } from 'src/common/utils/response.util';
import { Sequelize } from 'sequelize-typescript';

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

    private sequelize: Sequelize,
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

  async recordBall(
    dto: CreateBallEventDto,
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

    const isLegal =
      !extra_type || extra_type === 'bye' || extra_type === 'leg_bye';

    const overNumber = innings.overs;
    const ballNumber = isLegal ? innings.balls + 1 : innings.balls;

    const totalDeliveryRuns = runs_bat + runs_extra;

    const result = await this.sequelize.transaction(async (transaction) => {
      const ballEvent = await this.ballEventModel.create(
        {
          innings_id,
          over_number: overNumber,
          ball_number: ballNumber,
          striker_id,
          non_striker_id,
          bowler_id,
          runs_bat,
          runs_extra,
          extra_type: extra_type || null,
          is_wicket,
          wicket_type: wicket_type || null,
          dismissed_player_id: dismissed_player_id || null,
          fielder_id: fielder_id || null,
          is_legal: isLegal,
          metadata: metadata || null,
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
        if (dismissed_player_id === newStrikerId) {
          newStrikerId = null;
        } else if (dismissed_player_id === newNonStrikerId) {
          newNonStrikerId = null;
        }
      }

      if (extra_type === 'wide') {
        const runsRun = runs_extra - 1;
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

      const allOut = newWickets >= 10;
      const oversFinished = newOvers >= match.overs_per_side && newBalls === 0;

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
          if (updateData.total_runs > firstInnings.total_runs) {
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
            },
            { transaction },
          );
        } else if (innings.innings_number === 2 && firstInningsTotal !== null) {
          let winnerTeamId: number | null = null;
          if (targetChased) {
            winnerTeamId = innings.batting_team_id;
          } else if (updateData.total_runs < firstInningsTotal) {
            winnerTeamId = innings.bowling_team_id;
          } else if (updateData.total_runs === firstInningsTotal) {
            winnerTeamId = null;
          }

          await this.matchModel.update(
            {
              status: 'completed',
              winner_team_id: winnerTeamId,
            },
            {
              where: { id: match.id },
              transaction,
            },
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
  ): Promise<SuccessResponse<{ innings: Innings }>> {
    const innings = await this.inningsModel.findByPk(inningsId);
    if (!innings) {
      throw new NotFoundException('Innings not found');
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

      if (innings.status === 'completed') {
        updateData.status = 'in_progress';
      }

      await innings.update(updateData, { transaction });
      await lastEvent.destroy({ transaction });

      if (innings.status === 'completed') {
        if (innings.innings_number === 1) {
          const innings2 = await this.inningsModel.findOne({
            where: { match_id: innings.match_id, innings_number: 2 },
            transaction,
          });
          if (innings2) {
            if (innings2.status !== 'not_started') {
              throw new BadRequestException(
                'Cannot undo: Innings 2 has already started.',
              );
            }
            await innings2.destroy({ transaction });
          }
        } else if (innings.innings_number === 2) {
          await this.matchModel.update(
            {
              status: 'live',
              winner_team_id: null,
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
    const innings = await this.inningsModel.findByPk(inningsId);
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

      const batter = battersMap.get(strikerId)!;

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
}
