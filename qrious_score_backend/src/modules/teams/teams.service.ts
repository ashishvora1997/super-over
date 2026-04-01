import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateTeamDto } from './dtos/create-team.dto';
import { successResponse } from 'src/common/utils/response.util';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { Team } from './teams.model';
import { AssignPlayersDto } from './dtos/assign-players.dto';
import { TeamPlayer } from './team-player.model';
import { Player } from '../players/players.model';
import {
  FindTeamsQuery,
  TeamWhereOptions,
} from './interfaces/find-teams-query.interface';
import { SuccessResponse } from 'src/common/types/response.type';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team)
    private teamModel: typeof Team,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,
  ) {}

  async create(data: CreateTeamDto) {
    const team = await this.teamModel.create({
      ...data,
      name: data.name.trim(),
    });

    return successResponse('Team created successfully', team);
  }

  async findAll(query: FindTeamsQuery = {}): Promise<SuccessResponse<Team[]>> {
    const { search, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const where: TeamWhereOptions = {};

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { rows, count } = await this.teamModel.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Player,
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return successResponse('Teams retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async findOne(id: number) {
    const team = await this.teamModel.findByPk(id, {
      include: [
        {
          model: Player,
          through: { attributes: [] },
        },
      ],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return successResponse('Team retrieved successfully', team);
  }

  async update(id: number, data: UpdateTeamDto) {
    const team = await this.teamModel.findByPk(id);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await team.update(data);

    return successResponse('Team updated successfully', team);
  }

  async delete(id: number) {
    const team = await this.teamModel.findByPk(id);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await team.destroy();

    return successResponse('Team deleted successfully', null);
  }

  async assignPlayers(data: AssignPlayersDto) {
    const { team_id, player_ids } = data;

    await this.teamPlayerModel.destroy({
      where: { team_id },
    });

    const payload = player_ids.map((player_id) => ({
      team_id,
      player_id,
    }));

    await this.teamPlayerModel.bulkCreate(payload);

    return successResponse('Players assigned to team successfully', null);
  }
}
