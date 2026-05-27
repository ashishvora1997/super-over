import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateTeamDto } from './dtos/create-team.dto';
import { successResponse } from 'src/common/utils/response.util';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { Team } from './models/teams.model';
import { TeamPlayer } from './models/team-player.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';
import { Player } from '../players/models/players.model';
import { User } from '../users/models/user.model';
import {
  FindTeamsQuery,
  TeamWhereOptions,
} from './interfaces/find-teams-query.interface';
import { SuccessResponse } from 'src/common/types/response.type';
import { getPagination } from 'src/common/utils/pagination';
import { SetCaptainDto } from './dtos/set-captain.dto';
import { SetWicketKeeperDto } from './dtos/set-wicket-keeper.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team)
    private teamModel: typeof Team,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(Player)
    private playerModel: typeof Player,

    @InjectModel(TournamentTeam)
    private tournamentTeamModel: typeof TournamentTeam,

    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  private async findTeamById(id: number): Promise<Team> {
    const team = await this.teamModel.findByPk(id);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private async setTeamRole(
    teamId: number,
    playerId: number | null,
    userId: number,
    field: 'captain_id' | 'wicket_keeper_id',
    successMessage: string,
    removeMessage: string,
  ): Promise<SuccessResponse<null>> {
    const team = await this.teamModel.findByPk(teamId, {
      attributes: ['id', 'created_by'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.created_by !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this team',
      );
    }

    if (playerId === null) {
      await this.teamModel.update({ [field]: null }, { where: { id: teamId } });

      return successResponse(removeMessage, null);
    }

    const relation = await this.teamPlayerModel.findOne({
      where: {
        team_id: teamId,
        player_id: playerId,
      },
      attributes: ['player_id'],
    });

    if (!relation) {
      throw new BadRequestException('Player is not part of this team');
    }

    await this.teamModel.update(
      { [field]: playerId },
      { where: { id: teamId } },
    );

    return successResponse(successMessage, null);
  }

  async create(data: CreateTeamDto): Promise<SuccessResponse<Team>> {
    const { tournament_id, add_creator_as_player, ...teamData } = data;

    const transaction = await this.teamModel.sequelize!.transaction();

    try {
      const normalizedName = teamData.name.trim();

      if (tournament_id) {
        const existingTeam = await this.teamModel.findOne({
          where: {
            name: {
              [Op.iLike]: normalizedName,
            },
          },
          include: [
            {
              model: TournamentTeam,
              attributes: [],
              where: { tournament_id },
            },
          ],
          transaction,
        });

        if (existingTeam) {
          throw new BadRequestException(
            `A team named "${normalizedName}" already exists in this tournament.`,
          );
        }
      }

      const team = await this.teamModel.create(
        {
          ...teamData,
          name: normalizedName,
          created_by: teamData.created_by,
        },
        { transaction },
      );

      if (tournament_id) {
        await this.tournamentTeamModel.create(
          {
            tournament_id,
            team_id: team.id,
          },
          { transaction },
        );
      }

      if (add_creator_as_player && teamData.created_by) {
        const creatorPlayer = await this.playerModel.findOne({
          where: { user_id: teamData.created_by },
          transaction,
        });

        if (creatorPlayer) {
          await this.teamPlayerModel.create(
            {
              team_id: team.id,
              player_id: creatorPlayer.id,
            },
            { transaction },
          );
        }
      }

      await transaction.commit();

      return successResponse('Team created successfully', {
        id: team.id,
        name: team.name,
        short_name: team.short_name,
        city: team.city,
        created_by: team.created_by,
        createdAt: team.createdAt,
      } as Team);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(
    query: FindTeamsQuery = {},
    userId: number,
  ): Promise<SuccessResponse<Team[]>> {
    const { search } = query;
    const { page, limit, offset } = getPagination(query.page, query.limit);

    const userPlayer = await this.playerModel.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });

    let memberTeamIds: number[] = [];

    if (userPlayer) {
      const memberships = await this.teamPlayerModel.findAll({
        where: { player_id: userPlayer.id },
        attributes: ['team_id'],
      });

      memberTeamIds = memberships.map((m) => m.team_id);
    }

    let where: TeamWhereOptions = {
      [Op.or]: [
        { created_by: userId },
        ...(memberTeamIds.length ? [{ id: { [Op.in]: memberTeamIds } }] : []),
      ],
    };

    if (search) {
      where = {
        ...where,
        name: {
          [Op.iLike]: `%${search.trim()}%`,
        },
      };
    }

    const { rows, count } = await this.teamModel.findAndCountAll({
      where,
      limit,
      offset,

      attributes: [
        'id',
        'name',
        'short_name',
        'city',
        'created_by',
        'createdAt',

        [
          this.teamModel.sequelize!.literal(`(
          SELECT COUNT(*)
          FROM team_players tp
          WHERE tp.team_id = "Team"."id"
        )`),
          'player_count',
        ],
      ],

      order: [['createdAt', 'DESC']],
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
          as: 'players',
          through: { attributes: [] },
        },
        { model: Player, as: 'captain' },
        { model: Player, as: 'wicket_keeper' },
      ],
    });

    return successResponse('Team retrieved successfully', team!);
  }

  async update(
    id: number,
    data: UpdateTeamDto,
    userId: number,
  ): Promise<SuccessResponse<Team>> {
    const team = await this.teamModel.findByPk(id, {
      attributes: ['id', 'created_by'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.created_by !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this team',
      );
    }

    const payload = {
      ...data,
      ...(data.name && {
        name: data.name.trim(),
      }),
    };

    await this.teamModel.update(payload, {
      where: { id },
    });

    const updatedTeam = await this.teamModel.findByPk(id);

    return successResponse('Team updated successfully', updatedTeam!);
  }

  async delete(id: number, userId: number): Promise<SuccessResponse<null>> {
    const team = await this.findTeamById(id);

    if (team.created_by !== undefined && team.created_by !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this team',
      );
    }

    await team.destroy();

    return successResponse('Team deleted successfully', null);
  }

  async removePlayer(
    teamId: number,
    playerId: number,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    const team = await this.findTeamById(teamId);

    if (team.created_by !== undefined && team.created_by !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this team',
      );
    }

    if (team.captain_id === playerId) {
      await team.update({ captain_id: null });
    }
    if (team.wicket_keeper_id === playerId) {
      await team.update({ wicket_keeper_id: null });
    }

    await this.teamPlayerModel.destroy({
      where: { team_id: teamId, player_id: playerId },
    });

    return successResponse('Player removed successfully', null);
  }

  async setCaptain(
    data: SetCaptainDto,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    return this.setTeamRole(
      data.team_id,
      data.player_id,
      userId,
      'captain_id',
      'Captain assigned successfully',
      'Captain removed successfully',
    );
  }

  async setWicketKeeper(
    data: SetWicketKeeperDto,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    return this.setTeamRole(
      data.team_id,
      data.player_id,
      userId,
      'wicket_keeper_id',
      'Wicket keeper assigned successfully',
      'Wicket keeper removed successfully',
    );
  }

  async addPlayerByEmail(
    data: { team_id: number; email: string },
    requesterId: number,
  ): Promise<SuccessResponse<Player>> {
    const { team_id } = data;

    const normalizedEmail = data.email.toLowerCase().trim();

    const team = await this.teamModel.findByPk(team_id, {
      attributes: ['id', 'created_by'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.created_by !== requesterId) {
      throw new ForbiddenException(
        'You do not have permission to add players to this team',
      );
    }

    const user = await this.userModel.findOne({
      where: {
        email: normalizedEmail,
        is_email_verified: true,
      },
      attributes: ['id', 'name'],
    });

    if (!user) {
      throw new BadRequestException(
        'No verified user found with this email address',
      );
    }

    let player = await this.playerModel.findOne({
      where: { user_id: user.id },
    });

    if (!player) {
      player = await this.playerModel.create({
        name: user.name,
        user_id: user.id,
        playing_role: 'none',
        batting_style: 'none',
        bowling_style: 'none',
      });
    }

    const transaction = await this.teamModel.sequelize!.transaction();

    try {
      const existing = await this.teamPlayerModel.findOne({
        where: {
          team_id,
          player_id: player.id,
        },
        transaction,
      });

      if (existing) {
        throw new BadRequestException(
          'This player is already a member of this team',
        );
      }

      const currentPlayerCount = await this.teamPlayerModel.count({
        where: { team_id },
        transaction,
      });

      if (currentPlayerCount >= 11) {
        throw new BadRequestException('Maximum 11 players allowed in a team');
      }

      await this.teamPlayerModel.create(
        {
          team_id,
          player_id: player.id,
        },
        { transaction },
      );

      await transaction.commit();

      return successResponse('Player added to team successfully', player);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
