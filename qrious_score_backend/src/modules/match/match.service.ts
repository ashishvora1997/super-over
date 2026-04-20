import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';

import { Match } from './models/match.model';
import { Tournament } from '../tournament/models/tournament.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';

import { CreateMatchDto } from './dtos/create-match.dto';
import { successResponse } from 'src/common/utils/response.util';
import { UpdateMatchDto } from './dtos/update-match.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { InjectModel } from '@nestjs/sequelize';
import { Team } from '../teams/models/teams.model';
import { Player } from '../players/models/players.model';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['live'],
  live: ['completed'],
  completed: [],
};

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(Tournament)
    private tournamentModel: typeof Tournament,

    @InjectModel(TournamentTeam)
    private tournamentTeamModel: typeof TournamentTeam,
  ) {}

  async create(data: CreateMatchDto): Promise<SuccessResponse<Match>> {
    const { tournament_id, team_a_id, team_b_id, match_date } = data;

    if (team_a_id === team_b_id) {
      throw new BadRequestException('Both teams cannot be the same');
    }

    const tournament = await this.tournamentModel.findByPk(tournament_id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status === 'completed') {
      throw new BadRequestException(
        'Cannot create match for completed tournament',
      );
    }

    if (
      tournament.start_date &&
      tournament.end_date &&
      (new Date(match_date) < new Date(tournament.start_date) ||
        new Date(match_date) > new Date(tournament.end_date))
    ) {
      throw new BadRequestException(
        'Match date must be within tournament duration',
      );
    }

    const teams = await this.tournamentTeamModel.findAll({
      where: {
        tournament_id,
        team_id: {
          [Op.in]: [team_a_id, team_b_id],
        },
      },
    });

    if (teams.length !== 2) {
      throw new BadRequestException(
        'Both teams must be part of this tournament',
      );
    }

    const existingMatch = await this.matchModel.findOne({
      where: {
        tournament_id,
        match_date,
        [Op.or]: [
          { team_a_id, team_b_id },
          { team_a_id: team_b_id, team_b_id: team_a_id },
        ],
      },
    });

    if (existingMatch) {
      throw new BadRequestException(
        'Match between these teams already exists on this date',
      );
    }

    const timeConflict = await this.matchModel.findOne({
      where: {
        match_date,
        [Op.or]: [
          { team_a_id: { [Op.in]: [team_a_id, team_b_id] } },
          { team_b_id: { [Op.in]: [team_a_id, team_b_id] } },
        ],
      },
    });

    if (timeConflict) {
      throw new BadRequestException(
        'One or both teams are already scheduled for another match at the same time',
      );
    }

    const match = await this.matchModel.create({
      ...data,
      status: 'scheduled',
    });

    return successResponse('Match created successfully', match);
  }

  async findOne(id: number): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id, {
      include: [
        { model: Tournament, attributes: ['id', 'name'] },
        {
          model: Team,
          as: 'teamA',
          attributes: ['id', 'name'],
          include: [
            { model: Player, as: 'players', attributes: ['id', 'name'] },
          ],
        },
        {
          model: Team,
          as: 'teamB',
          attributes: ['id', 'name'],
          include: [
            { model: Player, as: 'players', attributes: ['id', 'name'] },
          ],
        },
        { model: Team, as: 'winner', attributes: ['id', 'name'] },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return successResponse('Match retrieved successfully', match);
  }

  async findAll(tournament_id?: number): Promise<SuccessResponse<Match[]>> {
    const where: WhereOptions<Match> = {};

    if (tournament_id) {
      where.tournament_id = tournament_id;
    }

    const matches = await this.matchModel.findAll({
      where,
      order: [['match_date', 'DESC']],
      include: [
        { model: Tournament, attributes: ['id', 'name'] },
        { model: Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: Team, as: 'teamB', attributes: ['id', 'name'] },
        { model: Team, as: 'winner', attributes: ['id', 'name'] },
      ],
    });
    return successResponse('Matches retrieved successfully', matches);
  }

  async update(
    id: number,
    data: UpdateMatchDto,
  ): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === 'completed') {
      throw new BadRequestException('Cannot update a completed match');
    }

    if (match.status === 'live' && (data.team_a_id || data.team_b_id)) {
      throw new BadRequestException(
        'Cannot change teams after match has started',
      );
    }

    if (data.status && data.status !== match.status) {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[match.status] ?? [];
      if (!allowedTransitions.includes(data.status)) {
        throw new BadRequestException(
          `Invalid status transition from '${match.status}' to '${data.status}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
        );
      }
    }

    const teamA = data.team_a_id ?? match.team_a_id;
    const teamB = data.team_b_id ?? match.team_b_id;

    if (teamA === teamB) {
      throw new BadRequestException('Both teams cannot be the same');
    }

    if (data.winner_team_id !== undefined) {
      if (data.winner_team_id !== teamA && data.winner_team_id !== teamB) {
        throw new BadRequestException(
          'Winner must be one of the participating teams',
        );
      }

      const resolvedStatus = data.status ?? match.status;
      if (resolvedStatus !== 'completed') {
        throw new BadRequestException(
          'Winner can only be set when match status is completed',
        );
      }
    }

    const tournament = await this.tournamentModel.findByPk(match.tournament_id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const matchDate = data.match_date
      ? new Date(data.match_date)
      : match.match_date;

    if (
      tournament.start_date &&
      tournament.end_date &&
      (matchDate < new Date(tournament.start_date) ||
        matchDate > new Date(tournament.end_date))
    ) {
      throw new BadRequestException(
        'Match date must be within tournament duration',
      );
    }

    const teams = await this.tournamentTeamModel.findAll({
      where: {
        tournament_id: match.tournament_id,
        team_id: {
          [Op.in]: [teamA, teamB],
        },
      },
    });

    if (teams.length !== 2) {
      throw new BadRequestException(
        'Both teams must be part of this tournament',
      );
    }

    if (data.team_a_id || data.team_b_id || data.match_date) {
      const duplicateMatch = await this.matchModel.findOne({
        where: {
          tournament_id: match.tournament_id,
          match_date: matchDate,
          id: { [Op.ne]: id },
          [Op.or]: [
            { team_a_id: teamA, team_b_id: teamB },
            { team_a_id: teamB, team_b_id: teamA },
          ],
        },
      });

      if (duplicateMatch) {
        throw new BadRequestException(
          'A match between these teams already exists on this date',
        );
      }
    }

    if (data.team_a_id || data.team_b_id || data.match_date) {
      const timeConflict = await this.matchModel.findOne({
        where: {
          match_date: matchDate,
          id: { [Op.ne]: id },
          [Op.or]: [
            { team_a_id: { [Op.in]: [teamA, teamB] } },
            { team_b_id: { [Op.in]: [teamA, teamB] } },
          ],
        },
      });

      if (timeConflict) {
        throw new BadRequestException(
          'One or both teams are already scheduled for another match at the same time',
        );
      }
    }

    await match.update(data);

    return successResponse('Match updated successfully', match);
  }

  async delete(id: number): Promise<SuccessResponse<null>> {
    const match = await this.matchModel.findByPk(id);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled matches can be deleted');
    }

    await match.destroy();

    return successResponse('Match deleted successfully', null);
  }
}
