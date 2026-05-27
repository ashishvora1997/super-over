import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Toss } from './models/toss.model';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';
import { Team } from '../teams/models/teams.model';
import { CreateTossDto } from './dtos/create-toss.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { successResponse } from 'src/common/utils/response.util';

import { TeamPlayer } from '../teams/models/team-player.model';

@Injectable()
export class TossService {
  constructor(
    @InjectModel(Toss)
    private tossModel: typeof Toss,

    @InjectModel(Innings)
    private inningsModel: typeof Innings,

    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,
  ) {}

  async create(
    matchId: number,
    dto: CreateTossDto,
    userId: number,
  ): Promise<SuccessResponse<Toss>> {
    const match = await this.matchModel.findByPk(matchId);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.created_by !== userId) {
      throw new ForbiddenException(
        'Only the match organizer can conduct the toss',
      );
    }

    if (match.status === 'completed') {
      throw new BadRequestException('Cannot record toss for a completed match');
    }

    const existingToss = await this.tossModel.findOne({
      where: { match_id: matchId },
    });

    if (existingToss) {
      throw new BadRequestException('Toss already recorded for this match');
    }

    const teamA_players = await this.teamPlayerModel.count({
      where: { team_id: match.team_a_id },
    });
    const teamB_players = await this.teamPlayerModel.count({
      where: { team_id: match.team_b_id },
    });

    if (teamA_players < 2 || teamB_players < 2) {
      throw new BadRequestException(
        'Both teams must have at least 2 players to start the match',
      );
    }

    const { toss_winner_team_id, elected_to } = dto;

    if (
      toss_winner_team_id !== match.team_a_id &&
      toss_winner_team_id !== match.team_b_id
    ) {
      throw new BadRequestException(
        'Toss winner must be one of the two teams in this match',
      );
    }

    let battingTeamId: number;
    let bowlingTeamId: number;

    if (elected_to === 'bat') {
      battingTeamId = toss_winner_team_id;
      bowlingTeamId =
        toss_winner_team_id === match.team_a_id
          ? match.team_b_id
          : match.team_a_id;
    } else {
      bowlingTeamId = toss_winner_team_id;
      battingTeamId =
        toss_winner_team_id === match.team_a_id
          ? match.team_b_id
          : match.team_a_id;
    }

    const toss = await this.tossModel.create({
      match_id: matchId,
      toss_winner_team_id,
      elected_to,
    });

    await this.inningsModel.create({
      match_id: matchId,
      innings_number: 1,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      total_runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      status: 'not_started',
      max_wickets: 10,
    });

    if (match.status === 'scheduled') {
      await match.update({ status: 'live' });
    }

    const tossWithTeam = await this.tossModel.findByPk(toss.id, {
      include: [
        {
          model: Team,
          as: 'tossWinnerTeam',
          attributes: ['id', 'name'],
        },
      ],
    });

    return successResponse('Toss recorded successfully', tossWithTeam);
  }

  async findByMatch(matchId: number): Promise<SuccessResponse<Toss>> {
    const match = await this.matchModel.findByPk(matchId);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const toss = await this.tossModel.findOne({
      where: { match_id: matchId },
      include: [
        {
          model: Team,
          as: 'tossWinnerTeam',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!toss) {
      throw new NotFoundException('Toss not recorded for this match yet');
    }

    return successResponse('Toss retrieved successfully', toss);
  }
}
