import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Tournament } from './tournament.model';
import { TournamentTeam } from './tournament-team.model';
import { Team } from '../teams/teams.model';

import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { AssignTeamsDto } from './dtos/assign-teams.dto';

import { successResponse } from 'src/common/utils/response.util';

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Tournament)
    private tournamentModel: typeof Tournament,

    @InjectModel(TournamentTeam)
    private tournamentTeamModel: typeof TournamentTeam,
  ) {}

  async create(data: CreateTournamentDto) {
    const { start_date, end_date } = data;

    if (start_date && end_date && start_date > end_date) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    if (start_date && end_date) {
      const overlappingTournament = await this.tournamentModel.findOne({
        where: {
          [Op.and]: [
            {
              start_date: {
                [Op.lte]: end_date,
              },
            },
            {
              end_date: {
                [Op.gte]: start_date,
              },
            },
          ],
        },
      });

      if (overlappingTournament) {
        throw new BadRequestException(
          'Tournament dates overlap with an existing tournament',
        );
      }
    }

    const tournament = await this.tournamentModel.create({
      ...data,
      name: data.name.trim(),
      status: data.status || 'upcoming',
    });

    return successResponse('Tournament created successfully', tournament);
  }

  async findAll(search?: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { rows, count } = await this.tournamentModel.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Team,
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return successResponse('Tournaments retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async findOne(id: number) {
    const tournament = await this.tournamentModel.findByPk(id, {
      include: [
        {
          model: Team,
          through: { attributes: [] },
        },
      ],
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return successResponse('Tournament retrieved successfully', tournament);
  }

  async update(id: number, data: UpdateTournamentDto) {
    const tournament = await this.tournamentModel.findByPk(id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (data.start_date && data.end_date) {
      const overlappingTournament = await this.tournamentModel.findOne({
        where: {
          id: { [Op.ne]: id }, // exclude current
          [Op.and]: [
            {
              start_date: {
                [Op.lte]: data.end_date,
              },
            },
            {
              end_date: {
                [Op.gte]: data.start_date,
              },
            },
          ],
        },
      });

      if (overlappingTournament) {
        throw new BadRequestException(
          'Updated dates overlap with another tournament',
        );
      }
    }

    await tournament.update(data);

    return successResponse('Tournament updated successfully', tournament);
  }

  async delete(id: number) {
    const tournament = await this.tournamentModel.findByPk(id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    await tournament.destroy();

    return successResponse('Tournament deleted successfully', null);
  }

  async assignTeams(data: AssignTeamsDto) {
    const { tournament_id, team_ids } = data;

    await this.tournamentTeamModel.destroy({
      where: { tournament_id },
    });

    const payload = team_ids.map((team_id) => ({
      tournament_id,
      team_id,
    }));

    await this.tournamentTeamModel.bulkCreate(payload);

    return successResponse('Teams assigned successfully', null);
  }
}
