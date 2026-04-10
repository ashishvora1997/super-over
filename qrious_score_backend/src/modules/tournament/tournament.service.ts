import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { Tournament } from './models/tournament.model';
import { TournamentTeam } from './models/tournament-team.model';
import { Team } from '../teams/models/teams.model';

import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { AssignTeamsDto } from './dtos/assign-teams.dto';

import { successResponse } from 'src/common/utils/response.util';
import { SuccessResponse } from 'src/common/types/response.type';

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Tournament)
    private readonly tournamentModel: typeof Tournament,

    @InjectModel(TournamentTeam)
    private readonly tournamentTeamModel: typeof TournamentTeam,
  ) {}
  async create(
    data: CreateTournamentDto,
  ): Promise<SuccessResponse<Tournament>> {
    const { start_date, end_date } = data;

    if (start_date && end_date && start_date > end_date) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    if (start_date && end_date) {
      const overlapping = await this.tournamentModel.findOne({
        where: {
          start_date: { [Op.lte]: end_date },
          end_date: { [Op.gte]: start_date },
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          'Tournament dates overlap with an existing tournament',
        );
      }
    }

    const tournament = await this.tournamentModel.create({
      ...data,
      name: data.name.trim(),
      status: data.status ?? 'upcoming',
    });

    return successResponse('Tournament created successfully', tournament);
  }

  async findAll(
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<SuccessResponse<Tournament[]>> {
    const offset = (page - 1) * limit;

    const where: WhereOptions<Tournament> = {};

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

  async findOne(id: number): Promise<SuccessResponse<Tournament>> {
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

  async update(
    id: number,
    data: UpdateTournamentDto,
  ): Promise<SuccessResponse<Tournament>> {
    const tournament = await this.tournamentModel.findByPk(id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (data.start_date && data.end_date) {
      if (data.start_date > data.end_date) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      const overlapping = await this.tournamentModel.findOne({
        where: {
          id: { [Op.ne]: id },
          start_date: { [Op.lte]: data.end_date },
          end_date: { [Op.gte]: data.start_date },
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          'Updated dates overlap with another tournament',
        );
      }
    }

    await tournament.update(data);

    return successResponse('Tournament updated successfully', tournament);
  }

  async delete(id: number): Promise<SuccessResponse<null>> {
    const tournament = await this.tournamentModel.findByPk(id);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    await tournament.destroy();

    return successResponse('Tournament deleted successfully', null);
  }

  async assignTeams(data: AssignTeamsDto): Promise<SuccessResponse<null>> {
    const { tournament_id, team_ids } = data;

    if (!team_ids.length) {
      throw new BadRequestException('At least one team must be assigned');
    }

    const uniqueTeamIds = [...new Set(team_ids)];

    const payload = uniqueTeamIds.map((team_id) => ({
      tournament_id,
      team_id,
    }));

    await this.tournamentTeamModel.destroy({
      where: { tournament_id },
    });

    await this.tournamentTeamModel.bulkCreate(payload);

    return successResponse('Teams assigned successfully', null);
  }
}
