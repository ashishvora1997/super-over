import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from './players.model';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { Op } from 'sequelize';
import { successResponse } from 'src/common/utils/response.util';
import {
  FindPlayersQuery,
  PlayerWhereOptions,
} from './interfaces/find-players-query.interface';
import { SuccessResponse } from 'src/common/types/response.type';

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

  async findAll(
    query: FindPlayersQuery = {},
  ): Promise<SuccessResponse<Player[]>> {
    const { search, page = 1, limit = 10, role } = query;
    const offset = (page - 1) * limit;

    const where: PlayerWhereOptions = {};

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    const { rows, count } = await this.playerModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse('Players retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async findOne(id: number) {
    const player = await this.findPlayerById(id);
    return successResponse('Player retrieved successfully', player);
  }

  async update(id: number, data: UpdatePlayerDto) {
    const player = await this.findPlayerById(id);
    await player.update(data);
    return successResponse('Player updated successfully', player);
  }

  async delete(id: number) {
    const player = await this.findPlayerById(id);
    await player.destroy();
    return successResponse('Player deleted successfully', null);
  }
}
