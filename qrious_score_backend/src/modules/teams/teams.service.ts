import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateTeamDto } from './dtos/create-team.dto';
import { successResponse } from 'src/common/utils/response.util';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { Team } from './models/teams.model';
import { AssignPlayersDto } from './dtos/assign-players.dto';
import { TeamPlayer } from './models/team-player.model';
import { Player } from '../players/models/players.model';
import {
  FindTeamsQuery,
  TeamWhereOptions,
} from './interfaces/find-teams-query.interface';
import { SuccessResponse } from 'src/common/types/response.type';
import { getPagination } from 'src/common/utils/pagination';
import { SetCaptainDto } from './dtos/set-captain.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team)
    private teamModel: typeof Team,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(Player)
    private playerModel: typeof Player,
  ) {}

  // ✅ Reusable helper
  private async findTeamById(id: number): Promise<Team> {
    const team = await this.teamModel.findByPk(id);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async create(data: CreateTeamDto): Promise<SuccessResponse<Team>> {
    const team = await this.teamModel.create({
      ...data,
      name: data.name.trim(),
    });

    return successResponse('Team created successfully', team);
  }

  async findAll(query: FindTeamsQuery = {}): Promise<SuccessResponse<Team[]>> {
    const { search } = query;

    const { page, limit, offset } = getPagination(query.page, query.limit);

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
          as: 'captain', // for the single captain
        },
        {
          model: Player,
          as: 'players', // for the many-to-many squad
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

  async findOne(id: number): Promise<SuccessResponse<Team>> {
    await this.findTeamById(id);

    const team = await this.teamModel.findByPk(id, {
      include: [
        {
          model: Player,
          through: { attributes: [] },
        },
      ],
    });

    return successResponse('Team retrieved successfully', team!);
  }

  async update(
    id: number,
    data: UpdateTeamDto,
  ): Promise<SuccessResponse<Team>> {
    const team = await this.findTeamById(id);

    await team.update({
      ...data,
      name: data.name?.trim(),
    });

    return successResponse('Team updated successfully', team);
  }

  async delete(id: number): Promise<SuccessResponse<null>> {
    const team = await this.findTeamById(id);

    await team.destroy();

    return successResponse('Team deleted successfully', null);
  }

  async assignPlayers(data: AssignPlayersDto): Promise<SuccessResponse<null>> {
    const { team_id, player_ids } = data;

    await this.findTeamById(team_id);

    const transaction = await this.teamModel.sequelize!.transaction();

    try {
      await this.teamPlayerModel.destroy({
        where: { team_id },
        transaction,
      });

      const payload = player_ids.map((player_id) => ({
        team_id,
        player_id,
      }));

      await this.teamPlayerModel.bulkCreate(payload, { transaction });

      await transaction.commit();

      return successResponse('Players assigned to team successfully', null);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async setCaptain(data: SetCaptainDto): Promise<SuccessResponse<Team>> {
    const { team_id, player_id } = data;

    const team = await this.teamModel.findByPk(team_id);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const player = await this.playerModel.findByPk(player_id);

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const relation = await this.teamPlayerModel.findOne({
      where: {
        team_id,
        player_id,
      },
    });

    if (!relation) {
      throw new BadRequestException('Player is not part of this team');
    }

    await team.update({ captain_id: player_id });

    const updatedTeam = await this.teamModel.findByPk(team_id, {
      include: [
        {
          model: Player,
          as: 'captain',
        },
      ],
    });

    return successResponse('Captain assigned successfully', updatedTeam!);
  }
}
