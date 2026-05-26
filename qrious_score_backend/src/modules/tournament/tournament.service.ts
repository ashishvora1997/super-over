import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { Tournament } from './models/tournament.model';
import { TournamentTeam } from './models/tournament-team.model';
import { TournamentScorer } from './models/tournament-scorer.model';
import { Rules } from './models/rules.model';
import { Team } from '../teams/models/teams.model';
import { Match } from '../match/models/match.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Player } from '../players/models/players.model';
import { User } from '../users/models/user.model';

import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { AssignTeamsDto } from './dtos/assign-teams.dto';
import { UpsertRulesDto } from './dtos/upsert-rules.dto';
import { AddScorerDto } from './dtos/add-scorer.dto';
import { RemoveScorerDto } from './dtos/remove-scorer.dto';

import { successResponse } from 'src/common/utils/response.util';
import { SuccessResponse } from 'src/common/types/response.type';
import { PointsTableService } from '../points-table/points-table.service';

const MAX_SCORERS = 3;

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Tournament)
    private readonly tournamentModel: typeof Tournament,

    @InjectModel(TournamentTeam)
    private readonly tournamentTeamModel: typeof TournamentTeam,

    @InjectModel(TournamentScorer)
    private readonly tournamentScorerModel: typeof TournamentScorer,

    @InjectModel(Rules)
    private readonly rulesModel: typeof Rules,

    @InjectModel(Team)
    private readonly teamModel: typeof Team,

    @InjectModel(Match)
    private readonly matchModel: typeof Match,

    @InjectModel(Player)
    private readonly playerModel: typeof Player,

    @InjectModel(TeamPlayer)
    private readonly teamPlayerModel: typeof TeamPlayer,

    @InjectModel(User)
    private readonly userModel: typeof User,

    private readonly pointsTableService: PointsTableService,
  ) {}

  private async findTournamentById(id: number): Promise<Tournament> {
    const tournament = await this.tournamentModel.findByPk(id);
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return tournament;
  }

  private assertOwner(tournament: Tournament, userId: number): void {
    if (tournament.created_by !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage this tournament',
      );
    }
  }

  async create(
    data: CreateTournamentDto,
  ): Promise<SuccessResponse<Tournament>> {
    const { start_date, end_date } = data;

    if (start_date && end_date && start_date > end_date) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const tournament = await this.tournamentModel.create({
      ...data,
      name: data.name.trim(),
      organiser_email: data.organiser_email.trim().toLowerCase(),
      status: 'upcoming',
      created_by: data.created_by,
    });

    await this.rulesModel.create({
      tournament_id: tournament.id,
    });

    await this.tournamentScorerModel.create({
      tournament_id: tournament.id,
      user_id: tournament.created_by,
    });

    return successResponse('Tournament created successfully', tournament);
  }

  async findAll(
    search?: string,
    page = 1,
    limit = 10,
    userId?: number,
  ): Promise<SuccessResponse<Tournament[]>> {
    const offset = (page - 1) * limit;

    const orConditions: any[] = [];

    if (userId) {
      orConditions.push({ created_by: userId });

      const userPlayer = await this.playerModel.findOne({
        where: { user_id: userId },
      });

      if (userPlayer) {
        const memberships = await this.teamPlayerModel.findAll({
          where: { player_id: userPlayer.id },
          attributes: ['team_id'],
        });
        const memberTeamIds = memberships.map((m) => m.team_id);

        if (memberTeamIds.length) {
          const tournamentTeams = await this.tournamentTeamModel.findAll({
            where: { team_id: { [Op.in]: memberTeamIds } },
            attributes: ['tournament_id'],
          });
          const participatingTournamentIds = [
            ...new Set(tournamentTeams.map((tt) => tt.tournament_id)),
          ];
          if (participatingTournamentIds.length) {
            orConditions.push({ id: { [Op.in]: participatingTournamentIds } });
          }
        }
      }

      const scorerEntries = await this.tournamentScorerModel.findAll({
        where: { user_id: userId },
        attributes: ['tournament_id'],
      });
      const scorerTournamentIds = scorerEntries.map((s) => s.tournament_id);
      if (scorerTournamentIds.length) {
        orConditions.push({ id: { [Op.in]: scorerTournamentIds } });
      }
    }

    const where: WhereOptions<Tournament> = {};

    if (orConditions.length > 0) {
      where[Op.or as any] = orConditions;
    }

    if (search) {
      (where as any).name = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await this.tournamentModel.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: Team, through: { attributes: [] } }],
      order: [['createdAt', 'DESC']],
      distinct: true,
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
        { model: Team, through: { attributes: [] } },
        { model: Rules, as: 'rules' },
        {
          model: TournamentScorer,
          as: 'scorers',
          include: [{ model: User, attributes: ['id', 'name', 'email'] }],
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
    userId: number,
  ): Promise<SuccessResponse<Tournament>> {
    const tournament = await this.findTournamentById(id);
    this.assertOwner(tournament, userId);

    if (data.start_date && data.end_date) {
      if (data.start_date > data.end_date) {
        throw new BadRequestException('Start date cannot be after end date');
      }
    }

    await tournament.update(data);

    return successResponse('Tournament updated successfully', tournament);
  }

  async delete(id: number, userId: number): Promise<SuccessResponse<null>> {
    const tournament = await this.findTournamentById(id);
    this.assertOwner(tournament, userId);

    await tournament.destroy();

    return successResponse('Tournament deleted successfully', null);
  }

  async assignTeams(data: AssignTeamsDto): Promise<SuccessResponse<null>> {
    const { tournament_id, team_ids } = data;

    if (!team_ids.length) {
      throw new BadRequestException('At least one team must be assigned');
    }

    const uniqueTeamIds = [...new Set(team_ids)];

    const teamsWithPlayers = await this.teamModel.findAll({
      where: { id: uniqueTeamIds },
      include: [
        {
          model: Player,
          as: 'players',
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
      ],
    });

    const teamNames = teamsWithPlayers.map((t) => t.name.toLowerCase());
    const uniqueNames = new Set(teamNames);
    if (uniqueNames.size !== teamNames.length) {
      throw new BadRequestException(
        'Duplicate teams found. A team cannot appear twice inside the same tournament.',
      );
    }

    const playerTeamMap = new Map<number, { name: string; teamName: string }>();
    const duplicates: { playerName: string; teams: string[] }[] = [];

    for (const team of teamsWithPlayers) {
      for (const player of team.players ?? []) {
        const existing = playerTeamMap.get(player.id);
        if (existing) {
          const duplicateEntry = duplicates.find(
            (d) => d.playerName === player.name,
          );
          if (duplicateEntry) {
            if (!duplicateEntry.teams.includes(team.name)) {
              duplicateEntry.teams.push(team.name);
            }
          } else {
            duplicates.push({
              playerName: player.name,
              teams: [existing.teamName, team.name],
            });
          }
        } else {
          playerTeamMap.set(player.id, {
            name: player.name,
            teamName: team.name,
          });
        }
      }
    }

    if (duplicates.length > 0) {
      if (duplicates.length === 1) {
        const d = duplicates[0];
        throw new BadRequestException(
          `"${d.playerName}" belongs to ${d.teams.length} teams. Remove from one team.`,
        );
      }
      throw new BadRequestException(
        `${duplicates.length} players are assigned to multiple teams. Please resolve conflicts.`,
      );
    }

    const payload = uniqueTeamIds.map((team_id) => ({
      tournament_id,
      team_id,
    }));

    await this.tournamentTeamModel.destroy({
      where: { tournament_id },
    });

    await this.tournamentTeamModel.bulkCreate(payload);

    await this.pointsTableService.initializeForTournament(
      tournament_id,
      uniqueTeamIds,
    );

    return successResponse('Teams assigned successfully', null);
  }

  async removeTeam(
    tournamentId: number,
    teamId: number,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    const tournament = await this.findTournamentById(tournamentId);
    this.assertOwner(tournament, userId);

    const tournamentTeam = await this.tournamentTeamModel.findOne({
      where: { tournament_id: tournamentId, team_id: teamId },
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Team is not part of this tournament');
    }

    const activeMatches = await this.matchModel.count({
      where: {
        tournament_id: tournamentId,
        [Op.or]: [{ team_a_id: teamId }, { team_b_id: teamId }],
        status: { [Op.in]: ['live', 'completed'] },
      },
    });

    if (activeMatches > 0) {
      throw new BadRequestException(
        'Cannot remove this team — it has live or completed matches in this tournament',
      );
    }

    await this.matchModel.destroy({
      where: {
        tournament_id: tournamentId,
        [Op.or]: [{ team_a_id: teamId }, { team_b_id: teamId }],
        status: 'scheduled',
      },
    });

    await tournamentTeam.destroy();

    await this.pointsTableService.removeTeamFromTournament(
      tournamentId,
      teamId,
    );

    return successResponse('Team removed from tournament successfully', null);
  }

  async getRules(tournamentId: number): Promise<SuccessResponse<Rules>> {
    await this.findTournamentById(tournamentId);

    let rules = await this.rulesModel.findOne({
      where: { tournament_id: tournamentId, match_id: null },
    });

    if (!rules) {
      rules = await this.rulesModel.create({ tournament_id: tournamentId });
    }

    return successResponse('Tournament rules retrieved', rules);
  }

  async upsertRules(
    data: UpsertRulesDto,
    userId: number,
  ): Promise<SuccessResponse<Rules>> {
    const tournament = await this.findTournamentById(data.tournament_id);
    this.assertOwner(tournament, userId);

    const { tournament_id, ...ruleFields } = data;

    let rules = await this.rulesModel.findOne({
      where: { tournament_id, match_id: null },
    });

    if (rules) {
      await rules.update(ruleFields);
    } else {
      rules = await this.rulesModel.create({ tournament_id, ...ruleFields });
    }

    await this.rulesModel.update(ruleFields, {
      where: {
        tournament_id,
        match_id: { [Op.ne]: null },
        is_customized: false,
      },
    });

    return successResponse('Tournament rules updated', rules);
  }

  async getScorers(
    tournamentId: number,
  ): Promise<SuccessResponse<TournamentScorer[]>> {
    await this.findTournamentById(tournamentId);

    const scorers = await this.tournamentScorerModel.findAll({
      where: { tournament_id: tournamentId },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });

    return successResponse('Tournament scorers retrieved', scorers);
  }

  async addScorer(
    data: AddScorerDto,
    userId: number,
  ): Promise<SuccessResponse<TournamentScorer>> {
    const tournament = await this.findTournamentById(data.tournament_id);
    this.assertOwner(tournament, userId);

    const currentCount = await this.tournamentScorerModel.count({
      where: { tournament_id: data.tournament_id },
    });

    if (currentCount >= MAX_SCORERS) {
      throw new BadRequestException(
        `Maximum ${MAX_SCORERS} scorers allowed for a tournament`,
      );
    }

    const user = await this.userModel.findOne({
      where: {
        email: data.email.toLowerCase().trim(),
        is_email_verified: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'No verified user found with this email address',
      );
    }

    const existing = await this.tournamentScorerModel.findOne({
      where: { tournament_id: data.tournament_id, user_id: user.id },
    });

    if (existing) {
      throw new BadRequestException(
        'This user is already a scorer for this tournament',
      );
    }

    const scorer = await this.tournamentScorerModel.create({
      tournament_id: data.tournament_id,
      user_id: user.id,
    });

    const scorerWithUser = await this.tournamentScorerModel.findByPk(
      scorer.id,
      { include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
    );

    return successResponse('Scorer added successfully', scorerWithUser!);
  }

  async removeScorer(
    data: RemoveScorerDto,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    const tournament = await this.findTournamentById(data.tournament_id);
    this.assertOwner(tournament, userId);

    if (data.user_id === tournament.created_by) {
      throw new BadRequestException(
        'Cannot remove the tournament owner as a scorer',
      );
    }

    const scorer = await this.tournamentScorerModel.findOne({
      where: { tournament_id: data.tournament_id, user_id: data.user_id },
    });

    if (!scorer) {
      throw new NotFoundException('Scorer not found');
    }

    await scorer.destroy();

    return successResponse('Scorer removed successfully', null);
  }
}
