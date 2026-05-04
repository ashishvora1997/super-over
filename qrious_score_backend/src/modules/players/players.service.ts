import 'multer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from './models/players.model';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { Op } from 'sequelize';
import { successResponse } from 'src/common/utils/response.util';
import {
  FindPlayersQuery,
  PlayerWhereOptions,
} from './interfaces/find-players-query.interface';
import { SuccessResponse } from 'src/common/types/response.type';
import { getPagination } from 'src/common/utils/pagination';
import { parseUploadedFile } from 'src/common/utils/csv-parser.util';
import {
  FieldRule,
  validateCSVRow,
} from 'src/common/utils/csv-row-validator.util';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player)
    private playerModel: typeof Player,
  ) {}

  private async findPlayerById(id: number): Promise<Player> {
    const player = await this.playerModel.findByPk(id);
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async create(data: CreatePlayerDto): Promise<SuccessResponse<Player>> {
    const player = await this.playerModel.create({
      ...data,
      name: data.name.trim(),
    });

    return successResponse('Player created successfully', player);
  }

  async findAllPlayersList(): Promise<SuccessResponse<Player[]>> {
    const players = await this.playerModel.findAll({
      attributes: ['id', 'name', 'role'],
      order: [['name', 'ASC']],
    });

    return successResponse(
      'Players retrieved successfully for selection',
      players,
    );
  }

  async findAll(
    query: FindPlayersQuery = {},
  ): Promise<SuccessResponse<Player[]>> {
    const { search, role } = query;

    const { page, limit, offset } = getPagination(query.page, query.limit);

    const where: PlayerWhereOptions = {};

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    if (role && role !== 'all' && role.toLowerCase() !== 'all') {
      where.role = role;
    }

    const { rows, count } = await this.playerModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return successResponse('Players retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async findOne(id: number): Promise<SuccessResponse<Player>> {
    const player = await this.findPlayerById(id);
    return successResponse('Player retrieved successfully', player);
  }

  async update(
    id: number,
    data: UpdatePlayerDto,
  ): Promise<SuccessResponse<Player>> {
    const player = await this.findPlayerById(id);
    await player.update({
      ...data,
      name: data.name?.trim(),
    });
    return successResponse('Player updated successfully', player);
  }

  async delete(id: number): Promise<SuccessResponse<null>> {
    const player = await this.findPlayerById(id);
    await player.destroy();
    return successResponse('Player deleted successfully', null);
  }

  async handleBulkUpload(file: Express.Multer.File) {
    const expectedHeaders = ['name', 'role', 'batting_style', 'bowling_style'];

    const rows = parseUploadedFile(
      file.buffer,
      file.mimetype,
      file.originalname,
      expectedHeaders,
    );

    const rules: FieldRule[] = [
      { field: 'name', required: true, type: 'string' },
      {
        field: 'role',
        required: true,
        type: 'string',
        validValues: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
      },
      { field: 'batting_style', required: false, type: 'string', validValues: ['RHB', 'LHB'] },
      { field: 'bowling_style', required: false, type: 'string', validValues: ['RAF', 'LAF', 'OFF', 'LAO', 'LEG'] },
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
      return successResponse('Validation failed. No players were imported.', {
        success_count: 0,
        failed_count: errors.length,
        errors,
      });
    }

    const playersToInsert = rows.map((row) => ({
      name: row.name.trim(),
      role: row.role.trim(),
      batting_style: row.batting_style?.trim() || null,
      bowling_style: row.bowling_style?.trim() || null,
    }));

    await this.playerModel.sequelize.transaction(async (t) => {
      await this.playerModel.bulkCreate(playersToInsert, { transaction: t });
    });

    return successResponse('Bulk upload completed successfully.', {
      success_count: playersToInsert.length,
      failed_count: 0,
      errors: [],
    });
  }
}
