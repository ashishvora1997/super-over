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
import { User } from '../users/models/user.model';
import { UpsertProfileDto } from './dtos/upsert-profile.dto';

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
      attributes: ['id', 'name', 'playing_role'],
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
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (role && role !== 'all' && role.toLowerCase() !== 'all') {
      where.playing_role = role;
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

  async upsertProfile(
    userId: number,
    dto: UpsertProfileDto,
  ): Promise<SuccessResponse<Player>> {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    let player = await Player.findOne({ where: { user_id: userId } });

    if (player) {
      await player.update({ ...dto });
    } else {
      player = await Player.create({
        name: user.name,
        user_id: userId,
        ...dto,
      });
    }

    await user.update({ is_profile_complete: true });

    const updated = await Player.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role', 'is_profile_complete'],
        },
      ],
    });

    return successResponse('Profile updated successfully', updated);
  }

  async delete(id: number): Promise<SuccessResponse<null>> {
    const player = await this.findPlayerById(id);
    await player.destroy();
    return successResponse('Player deleted successfully', null);
  }

  async getMyProfile(userId: number): Promise<SuccessResponse<Player>> {
    let player = await Player.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role', 'is_profile_complete'],
        },
      ],
    });

    if (!player) {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'is_profile_complete'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      player = await Player.create({
        name: user.name,
        user_id: userId,
        playing_role: 'none',
        batting_style: 'none',
        bowling_style: 'none',
        date_of_birth: null,
        location: null,
        gender: null,
        profile_picture: null,
      });

      player = await Player.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role', 'is_profile_complete'],
          },
        ],
      });
    }

    return successResponse('Profile retrieved successfully', player);
  }

  async handleBulkUpload(file: Express.Multer.File) {
    const expectedHeaders = [
      'name',
      'playing_role',
      'batting_style',
      'bowling_style',
      'date_of_birth',
      'location',
      'gender',
    ];

    const rows = parseUploadedFile(
      file.buffer,
      file.mimetype,
      file.originalname,
      expectedHeaders,
    );

    const rules: FieldRule[] = [
      { field: 'name', required: true, type: 'string' },
      {
        field: 'playing_role',
        required: true,
        type: 'string',
        validValues: [
          'top_order_batter',
          'middle_order_batter',
          'opening_batter',
          'wicket_keeper_batter',
          'wicket_keeper',
          'bowler',
          'all_rounder',
          'lower_order_batter',
          'none',
        ],
      },
      {
        field: 'batting_style',
        required: false,
        type: 'string',
        validValues: ['right_hand', 'left_hand', 'none'],
      },
      {
        field: 'bowling_style',
        required: false,
        type: 'string',
        validValues: [
          'right_arm_fast',
          'right_arm_medium',
          'left_arm_fast',
          'left_arm_medium',
          'slow_left_arm_orthodox',
          'slow_left_arm_chinaman',
          'right_arm_off_break',
          'right_arm_leg_break',
          'none',
        ],
      },
      { field: 'date_of_birth', required: false, type: 'date' },
      { field: 'location', required: false, type: 'string' },
      {
        field: 'gender',
        required: false,
        type: 'string',
        validValues: ['male', 'female'],
      },
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
      playing_role: row.playing_role.trim(),
      batting_style: row.batting_style?.trim() || null,
      bowling_style: row.bowling_style?.trim() || null,
      date_of_birth: row.date_of_birth || null,
      location: row.location?.trim() || null,
      gender: row.gender?.trim() || null,
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
