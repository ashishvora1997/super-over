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
import {
  FieldRule,
  validateCSVRow,
} from 'src/common/utils/csv-row-validator.util';
import { parseUploadedFile } from 'src/common/utils/csv-parser.util';

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
          as: 'captain',
        },
        {
          model: Player,
          as: 'players',
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return successResponse('Teams retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async findAllTeamsList(): Promise<SuccessResponse<Team[]>> {
    const teams = await this.teamModel.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return successResponse('Teams retrieved successfully for selection', teams);
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

  async setWicketKeeper(
    data: import('./dtos/set-wicket-keeper.dto').SetWicketKeeperDto,
  ): Promise<SuccessResponse<Team>> {
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

    await team.update({ wicket_keeper_id: player_id });

    const updatedTeam = await this.teamModel.findByPk(team_id, {
      include: [
        {
          model: Player,
          as: 'wicket_keeper',
        },
      ],
    });

    return successResponse('Wicket keeper assigned successfully', updatedTeam!);
  }

  async handleBulkUpload(file: Express.Multer.File) {
    const expectedHeaders = [
      'name',
      'short_name',
      'city',
      'jersey_color',
      'home_ground',
      'founded_year',
      'description',
    ];

    const rows = parseUploadedFile(
      file.buffer,
      file.mimetype,
      file.originalname,
      expectedHeaders,
    );

    const rules: FieldRule[] = [
      { field: 'name', required: true, type: 'string' },
      { field: 'short_name', required: true, type: 'string' },
      { field: 'city', required: false, type: 'string' },
      { field: 'jersey_color', required: false, type: 'string' },
      { field: 'home_ground', required: false, type: 'string' },
      { field: 'founded_year', required: false, type: 'number' },
      { field: 'description', required: false, type: 'string' },
    ];

    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const error = validateCSVRow(rows[i], rules);
      if (error) {
        errors.push({ row: rowNumber, error });
      }
    }

    if (errors.length > 0) {
      return successResponse('Validation failed. No teams were imported.', {
        success_count: 0,
        failed_count: errors.length,
        errors,
      });
    }

    const teamsToInsert = rows.map((row) => ({
      name: row.name.trim(),
      short_name: row.short_name.trim(),
      city: row.city?.trim() || null,
      jersey_color: row.jersey_color?.trim() || null,
      home_ground: row.home_ground?.trim() || null,
      founded_year: row.founded_year ? Number(row.founded_year) : null,
      description: row.description?.trim() || null,
    }));

    await this.teamModel.sequelize.transaction(async (t) => {
      await this.teamModel.bulkCreate(teamsToInsert, { transaction: t });
    });

    return successResponse('Bulk upload completed successfully.', {
      success_count: teamsToInsert.length,
      failed_count: 0,
      errors: [],
    });
  }
}
