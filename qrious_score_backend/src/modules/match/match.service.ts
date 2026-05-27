import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';

import { Match } from './models/match.model';
import { Tournament } from '../tournament/models/tournament.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';

import { CreateMatchDto } from './dtos/create-match.dto';
import { successResponse } from 'src/common/utils/response.util';
import { UpdateMatchDto } from './dtos/update-match.dto';
import { SuccessResponse } from 'src/common/types/response.type';
import { InjectModel } from '@nestjs/sequelize';
import { Team } from '../teams/models/teams.model';
import { Player } from '../players/models/players.model';
import { Innings } from '../innings/models/innings.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Rules } from '../tournament/models/rules.model';

import { TournamentScorer } from '../tournament/models/tournament-scorer.model';
import { MatchScorer } from './models/match-scorer.model';
import { User } from '../users/models/user.model';
import { AddMatchScorerDto } from './dtos/add-match-scorer.dto';
import { RemoveMatchScorerDto } from './dtos/remove-match-scorer.dto';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['live'],
  live: ['completed'],
  completed: [],
};

export interface EnrichedScorer {
  id: number;
  name: string;
  email: string;
  isBusy: boolean;
}

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(Tournament)
    private tournamentModel: typeof Tournament,

    @InjectModel(TournamentTeam)
    private tournamentTeamModel: typeof TournamentTeam,

    @InjectModel(Team)
    private teamModel: typeof Team,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(Rules)
    private rulesModel: typeof Rules,

    @InjectModel(TournamentScorer)
    private tournamentScorerModel: typeof TournamentScorer,

    @InjectModel(MatchScorer)
    private matchScorerModel: typeof MatchScorer,

    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(data: CreateMatchDto): Promise<SuccessResponse<Match>> {
    const { tournament_id, team_a_id, team_b_id, match_date } = data;

    const conflicts: {
      type: string;
      message: string;
      items?: string[];
    }[] = [];

    if (team_a_id === team_b_id) {
      conflicts.push({
        type: 'same_team',
        message: 'Both teams cannot be the same',
      });
    }

    const overs = data.overs_per_side ?? 20;
    const oversPerBowler = Math.ceil(overs / 5);

    if (tournament_id) {
      const tournament = await this.tournamentModel.findByPk(tournament_id);

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      const teams = await this.tournamentTeamModel.findAll({
        where: {
          tournament_id,
          team_id: { [Op.in]: [team_a_id, team_b_id] },
        },
      });

      if (teams.length !== 2) {
        conflicts.push({
          type: 'team_not_in_tournament',
          message: 'Both teams must be part of this tournament',
        });
      }

      const matchDay = new Date(match_date);
      if (
        tournament.start_date &&
        tournament.end_date &&
        (matchDay < new Date(tournament.start_date) ||
          matchDay > new Date(tournament.end_date))
      ) {
        conflicts.push({
          type: 'date_out_of_tournament_range',
          message: 'Match date must be between tournament dates',
        });
      }

      const existingMatch = await this.matchModel.findOne({
        where: {
          tournament_id,
          match_date,
          [Op.or]: [
            { team_a_id, team_b_id },
            { team_a_id: team_b_id, team_b_id: team_a_id },
          ],
        },
      });

      if (existingMatch) {
        conflicts.push({
          type: 'duplicate_match',
          message:
            'A match between these teams already exists on this date in this tournament',
        });
      }
    } else {
      const teamA = await this.teamModel.findByPk(team_a_id);
      const teamB = await this.teamModel.findByPk(team_b_id);

      if (!teamA || !teamB) {
        conflicts.push({
          type: 'team_not_found',
          message: 'One or both teams not found',
        });
      }
    }

    const teamPlayersForScorerCheck = await this.teamPlayerModel.findAll({
      where: { team_id: { [Op.in]: [team_a_id, team_b_id] } },
      include: [{ model: Player, attributes: ['id', 'user_id', 'name'] }],
    });

    const participatingUserIds = new Set(
      teamPlayersForScorerCheck
        .map((tp) => (tp as TeamPlayer & { player?: Player }).player?.user_id)
        .filter(Boolean),
    );

    if (tournament_id) {
      const tournamentScorers = await this.tournamentScorerModel.findAll({
        where: { tournament_id },
        attributes: ['user_id'],
        include: [{ model: User, attributes: ['id', 'name'] }],
      });

      const conflictingScorers = tournamentScorers.filter((ts) =>
        participatingUserIds.has(ts.user_id),
      );
      if (conflictingScorers.length > 0) {
        const names = conflictingScorers
          .map(
            (ts) =>
              (ts as TournamentScorer & { user?: User }).user?.name ||
              'Unknown',
          )
          .join(', ');
        conflicts.push({
          type: 'scorer_conflict',
          message: `Scorer conflict: ${names} — cannot score and play in the same match. Remove them from scorers or this match.`,
        });
      }
    } else {
      if (participatingUserIds.has(data.created_by)) {
        conflicts.push({
          type: 'scorer_conflict',
          message:
            'You cannot create an individual match where you are participating as a player, because the match creator automatically becomes the default scorer.',
        });
      }
    }

    if (team_a_id !== team_b_id) {
      const teamAPlayers = await this.teamPlayerModel.findAll({
        where: { team_id: team_a_id },
        include: [{ model: Player, attributes: ['id', 'name'] }],
      });

      const teamBPlayers = await this.teamPlayerModel.findAll({
        where: { team_id: team_b_id },
        include: [{ model: Player, attributes: ['id', 'name'] }],
      });

      const teamAPlayerIds = new Set(teamAPlayers.map((tp) => tp.player_id));
      const sharedPlayers = teamBPlayers.filter((tp) =>
        teamAPlayerIds.has(tp.player_id),
      );

      if (sharedPlayers.length > 0) {
        const playerNames = sharedPlayers.map(
          (tp) =>
            (tp as TeamPlayer & { player?: Player }).player?.name ||
            `Player #${tp.player_id}`,
        );

        conflicts.push({
          type: 'shared_players',
          message: `${sharedPlayers.length} player(s) exist in both teams`,
          items: playerNames,
        });
      }
    }

    if (match_date && team_a_id !== team_b_id) {
      const matchStart = new Date(match_date);
      const estimatedDurationMs = (overs * 2 * 4 + 30) * 60 * 1000;
      const matchEnd = new Date(matchStart.getTime() + estimatedDurationMs);

      const dayStart = new Date(matchStart);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(matchStart);
      dayEnd.setHours(23, 59, 59, 999);

      const allTeamPlayers = await this.teamPlayerModel.findAll({
        where: { team_id: { [Op.in]: [team_a_id, team_b_id] } },
        include: [{ model: Player, attributes: ['id', 'name'] }],
      });

      const playerIds = [...new Set(allTeamPlayers.map((tp) => tp.player_id))];

      if (playerIds.length > 0) {
        const sameDayMatches = await this.matchModel.findAll({
          where: {
            match_date: { [Op.between]: [dayStart, dayEnd] },
            status: { [Op.ne]: 'completed' },
          },
          attributes: [
            'id',
            'team_a_id',
            'team_b_id',
            'match_date',
            'overs_per_side',
          ],
        });

        const overlappingMatches = sameDayMatches.filter((m) => {
          const existingStart = new Date(m.match_date);
          const existingOvers = m.overs_per_side ?? 20;
          const existingDurationMs = (existingOvers * 2 * 4 + 30) * 60 * 1000;
          const existingEnd = new Date(
            existingStart.getTime() + existingDurationMs,
          );

          return matchStart < existingEnd && existingStart < matchEnd;
        });

        if (overlappingMatches.length > 0) {
          const busyTeamIds = new Set<number>();
          overlappingMatches.forEach((m) => {
            busyTeamIds.add(m.team_a_id);
            busyTeamIds.add(m.team_b_id);
          });

          const busyPlayers = await this.teamPlayerModel.findAll({
            where: {
              team_id: { [Op.in]: [...busyTeamIds] },
              player_id: { [Op.in]: playerIds },
            },
            include: [{ model: Player, attributes: ['id', 'name'] }],
          });

          if (busyPlayers.length > 0) {
            const uniqueNames = [
              ...new Set(
                busyPlayers.map(
                  (tp) =>
                    (tp as TeamPlayer & { player?: Player }).player?.name ||
                    `Player #${tp.player_id}`,
                ),
              ),
            ];

            conflicts.push({
              type: 'scheduling_conflict',
              message: `${uniqueNames.length} player(s) already scheduled for another overlapping match on this date`,
              items: uniqueNames,
            });
          }
        }
      }
    }

    if (conflicts.length > 0) {
      throw new BadRequestException({
        message: 'Match cannot be created',
        conflicts,
      });
    }

    const match = await this.matchModel.create({
      tournament_id: tournament_id || null,
      team_a_id,
      team_b_id,
      match_date,
      venue: data.venue || null,
      overs_per_side: overs,
      overs_per_bowler: oversPerBowler,
      status: 'scheduled',
      created_by: data.created_by,
      active_scorer_id: data.created_by,
    });

    if (!tournament_id) {
      await this.matchScorerModel.create({
        match_id: match.id,
        user_id: data.created_by,
      });
    }

    if (tournament_id) {
      const tournamentRules = await this.rulesModel.findOne({
        where: { tournament_id, match_id: null },
      });

      const ruleData = tournamentRules
        ? {
            wide_runs: tournamentRules.wide_runs,
            no_ball_runs: tournamentRules.no_ball_runs,
            count_wide_as_legal_delivery:
              tournamentRules.count_wide_as_legal_delivery,
            count_no_ball_as_legal_delivery:
              tournamentRules.count_no_ball_as_legal_delivery,
            ignore_wide_rule: tournamentRules.ignore_wide_rule,
            ignore_no_ball_rule: tournamentRules.ignore_no_ball_rule,
          }
        : {};

      await this.rulesModel.create({
        tournament_id,
        match_id: match.id,
        is_customized: false,
        ...ruleData,
      });
    } else {
      await this.rulesModel.create({
        tournament_id: null,
        match_id: match.id,
        is_customized: true,
      });
    }

    return successResponse('Match created successfully', match);
  }

  async findOne(id: number): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id, {
      include: [
        { model: Tournament, attributes: ['id', 'name'] },
        {
          model: Team,
          as: 'teamA',
          attributes: ['id', 'name', 'wicket_keeper_id'],
          include: [
            { model: Player, as: 'players', attributes: ['id', 'name'] },
          ],
        },
        {
          model: Team,
          as: 'teamB',
          attributes: ['id', 'name', 'wicket_keeper_id'],
          include: [
            { model: Player, as: 'players', attributes: ['id', 'name'] },
          ],
        },
        { model: Team, as: 'winner', attributes: ['id', 'name'] },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return successResponse('Match retrieved successfully', match);
  }

  async findAll(
    tournament_id?: number,
    userId?: number,
  ): Promise<SuccessResponse<Match[]>> {
    const where: WhereOptions<Match> = {};

    if (tournament_id) {
      where.tournament_id = tournament_id;
    } else if (userId) {
      const userTeams = await this.teamPlayerModel.findAll({
        include: [
          {
            model: Player,
            where: { user_id: userId },
            attributes: ['id'],
          },
        ],
      });

      const userTeamIds = userTeams.map((tp) => tp.team_id);

      const visibilityConditions: WhereOptions<Match>[] = [
        { created_by: userId },
      ];

      if (userTeamIds.length > 0) {
        visibilityConditions.push({ team_a_id: { [Op.in]: userTeamIds } });
        visibilityConditions.push({ team_b_id: { [Op.in]: userTeamIds } });
      }

      const matchScorerEntries = await this.matchScorerModel.findAll({
        where: { user_id: userId },
        attributes: ['match_id'],
      });
      const scorerMatchIds = matchScorerEntries.map((ms) => ms.match_id);
      if (scorerMatchIds.length > 0) {
        visibilityConditions.push({ id: { [Op.in]: scorerMatchIds } });
      }

      const tournamentScorerEntries = await this.tournamentScorerModel.findAll({
        where: { user_id: userId },
        attributes: ['tournament_id'],
      });
      const scorerTournamentIds = tournamentScorerEntries.map(
        (ts) => ts.tournament_id,
      );
      if (scorerTournamentIds.length > 0) {
        visibilityConditions.push({
          tournament_id: { [Op.in]: scorerTournamentIds },
        });
      }

      where[Op.or] = visibilityConditions;
    }

    const matches = await this.matchModel.findAll({
      where,
      order: [['match_date', 'DESC']],
      include: [
        { model: Tournament, attributes: ['id', 'name'] },
        { model: Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: Team, as: 'teamB', attributes: ['id', 'name'] },
        { model: Team, as: 'winner', attributes: ['id', 'name'] },
        {
          model: Innings,
          attributes: [
            'id',
            'innings_number',
            'batting_team_id',
            'total_runs',
            'wickets',
            'overs',
            'balls',
            'status',
            'is_super_over',
          ],
          required: false,
        },
      ],
    });
    return successResponse('Matches retrieved successfully', matches);
  }

  async findAllMatchesList(): Promise<SuccessResponse<Match[]>> {
    const matches = await this.matchModel.findAll({
      order: [['match_date', 'DESC']],
    });

    return successResponse('Matches retrieved successfully', matches);
  }

  async update(
    id: number,
    data: UpdateMatchDto,
    userId: number,
  ): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const isConfigEdit =
      data.team_a_id ||
      data.team_b_id ||
      data.match_date ||
      data.venue ||
      data.overs_per_side;
    if (isConfigEdit) {
      if (match.created_by !== userId) {
        throw new ForbiddenException(
          'Only the match creator can edit match details',
        );
      }
      if (match.status !== 'scheduled') {
        throw new BadRequestException(
          'Cannot edit details of a match that is not scheduled',
        );
      }
    }

    if (match.status === 'completed') {
      throw new BadRequestException('Cannot update a completed match');
    }

    if (match.status === 'live' && (data.team_a_id || data.team_b_id)) {
      throw new BadRequestException(
        'Cannot change teams after match has started',
      );
    }

    if (
      match.status === 'live' &&
      data.overs_per_side !== undefined &&
      data.overs_per_side !== match.overs_per_side
    ) {
      throw new BadRequestException(
        'Cannot change overs per side after match has started',
      );
    }

    if (data.status && data.status !== match.status) {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[match.status] ?? [];
      if (!allowedTransitions.includes(data.status)) {
        throw new BadRequestException(
          `Invalid status transition from '${match.status}' to '${data.status}'.`,
        );
      }
    }

    const teamA = data.team_a_id ?? match.team_a_id;
    const teamB = data.team_b_id ?? match.team_b_id;

    if (teamA === teamB) {
      throw new BadRequestException('Both teams cannot be the same');
    }

    if (data.winner_team_id !== undefined) {
      if (data.winner_team_id !== teamA && data.winner_team_id !== teamB) {
        throw new BadRequestException(
          'Winner must be one of the participating teams',
        );
      }

      const resolvedStatus = data.status ?? match.status;
      if (resolvedStatus !== 'completed') {
        throw new BadRequestException(
          'Winner can only be set when match status is completed',
        );
      }
    }

    if (match.tournament_id) {
      const tournament = await this.tournamentModel.findByPk(
        match.tournament_id,
      );

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      const matchDate = data.match_date
        ? new Date(data.match_date)
        : match.match_date;

      if (
        tournament.start_date &&
        tournament.end_date &&
        (matchDate < new Date(tournament.start_date) ||
          matchDate > new Date(tournament.end_date))
      ) {
        throw new BadRequestException(
          'Match date must be between tournament dates',
        );
      }

      const teams = await this.tournamentTeamModel.findAll({
        where: {
          tournament_id: match.tournament_id,
          team_id: { [Op.in]: [teamA, teamB] },
        },
      });

      if (teams.length !== 2) {
        throw new BadRequestException(
          'Both teams must be part of this tournament',
        );
      }
    }

    if (data.team_a_id || data.team_b_id || data.match_date) {
      const duplicateMatch = await this.matchModel.findOne({
        where: {
          ...(match.tournament_id
            ? { tournament_id: match.tournament_id }
            : {}),
          match_date: data.match_date
            ? new Date(data.match_date)
            : match.match_date,
          id: { [Op.ne]: id },
          [Op.or]: [
            { team_a_id: teamA, team_b_id: teamB },
            { team_a_id: teamB, team_b_id: teamA },
          ],
        },
      });

      if (duplicateMatch) {
        throw new BadRequestException(
          'A match between these teams already exists on this date',
        );
      }
    }

    await match.update(data);

    return successResponse('Match updated successfully', match);
  }

  async getMatchRules(matchId: number): Promise<SuccessResponse<Rules>> {
    const match = await this.matchModel.findByPk(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    let rules = await this.rulesModel.findOne({
      where: { match_id: matchId },
    });

    if (!rules) {
      rules = await this.rulesModel.create({
        tournament_id: match.tournament_id,
        match_id: matchId,
        is_customized: !match.tournament_id,
      });
    }

    return successResponse('Match rules retrieved', rules);
  }

  async updateMatchRules(
    matchId: number,
    ruleFields: Partial<{
      wide_runs: number;
      no_ball_runs: number;
      count_wide_as_legal_delivery: boolean;
      count_no_ball_as_legal_delivery: boolean;
      ignore_wide_rule: boolean;
      ignore_no_ball_rule: boolean;
    }>,
    userId: number,
  ): Promise<SuccessResponse<Rules>> {
    const match = await this.matchModel.findByPk(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.created_by !== userId && match.active_scorer_id !== userId) {
      throw new ForbiddenException(
        'Only the match creator or active scorer can modify match rules',
      );
    }

    let rules = await this.rulesModel.findOne({
      where: { match_id: matchId },
    });

    if (rules) {
      await rules.update({ ...ruleFields, is_customized: true });
    } else {
      rules = await this.rulesModel.create({
        tournament_id: match.tournament_id,
        match_id: matchId,
        is_customized: true,
        ...ruleFields,
      });
    }

    return successResponse('Match rules updated', rules);
  }

  async delete(id: number, userId: number): Promise<SuccessResponse<null>> {
    const match = await this.matchModel.findByPk(id);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.created_by !== userId) {
      throw new ForbiddenException(
        'Only the match creator can delete the match',
      );
    }

    if (match.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled matches can be deleted');
    }

    await match.destroy();

    return successResponse('Match deleted successfully', null);
  }

  async checkConcurrentScoringSession(
    userId: number,
    currentMatchId: number,
  ): Promise<void> {
    const conflictingMatch = await this.matchModel.findOne({
      where: {
        active_scorer_id: userId,
        status: 'live',
        id: { [Op.ne]: currentMatchId },
      },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: Team, as: 'teamB', attributes: ['id', 'name'] },
      ],
    });

    if (conflictingMatch) {
      const teamAName = conflictingMatch.teamA?.name || 'Team A';
      const teamBName = conflictingMatch.teamB?.name || 'Team B';
      throw new BadRequestException(
        `You are currently the active scorer for a live match (${teamAName} vs ${teamBName}). Please transfer scoring access or complete that match before scoring another one.`,
      );
    }
  }

  async getActiveScoringSession(
    userId: number,
  ): Promise<SuccessResponse<Match | null>> {
    const activeMatch = await this.matchModel.findOne({
      where: {
        active_scorer_id: userId,
        status: 'live',
      },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: Team, as: 'teamB', attributes: ['id', 'name'] },
      ],
      attributes: ['id', 'status', 'team_a_id', 'team_b_id'],
    });

    return successResponse('Active scoring session', activeMatch);
  }

  async takeoverScoring(
    id: number,
    userId: number,
  ): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id);
    if (!match) throw new NotFoundException('Match not found');

    let isAuthorized = false;
    if (match.tournament_id) {
      const tournamentScorer = await this.tournamentScorerModel.findOne({
        where: { tournament_id: match.tournament_id, user_id: userId },
      });
      if (tournamentScorer) isAuthorized = true;
    } else {
      const matchScorer = await this.matchScorerModel.findOne({
        where: { match_id: id, user_id: userId },
      });
      if (matchScorer) isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not assigned as a scorer for this match',
      );
    }

    await this.checkConcurrentScoringSession(userId, id);

    await match.update({ active_scorer_id: userId });

    return successResponse('Scoring takeover successful', match);
  }

  async transferScoring(
    id: number,
    currentUserId: number,
    targetUserId: number,
  ): Promise<SuccessResponse<Match>> {
    const match = await this.matchModel.findByPk(id);
    if (!match) throw new NotFoundException('Match not found');

    if (
      match.active_scorer_id !== currentUserId &&
      match.created_by !== currentUserId
    ) {
      throw new ForbiddenException(
        'Only the active scorer or match admin can transfer scoring',
      );
    }

    let isTargetAuthorized = false;
    if (match.created_by === targetUserId) {
      isTargetAuthorized = true;
    } else if (match.tournament_id) {
      const tournamentScorer = await this.tournamentScorerModel.findOne({
        where: { tournament_id: match.tournament_id, user_id: targetUserId },
      });
      if (tournamentScorer) isTargetAuthorized = true;
    } else {
      const matchScorer = await this.matchScorerModel.findOne({
        where: { match_id: id, user_id: targetUserId },
      });
      if (matchScorer) isTargetAuthorized = true;
    }

    if (!isTargetAuthorized) {
      throw new BadRequestException(
        'Target user is not an assigned scorer for this match',
      );
    }

    await this.checkConcurrentScoringSession(targetUserId, id);

    await match.update({ active_scorer_id: targetUserId });

    return successResponse('Scoring transferred successfully', match);
  }

  async getScorers(id: number): Promise<SuccessResponse<EnrichedScorer[]>> {
    const match = await this.matchModel.findByPk(id);
    if (!match) throw new NotFoundException('Match not found');

    let scorerUsers: { id: number; name: string; email: string }[] = [];

    if (match.tournament_id) {
      const scorers = await this.tournamentScorerModel.findAll({
        where: { tournament_id: match.tournament_id },
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      });
      scorerUsers = scorers.map((s) => ({
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
      }));

      const creatorAlreadyIncluded = scorerUsers.some(
        (s) => s.id === match.created_by,
      );
      if (!creatorAlreadyIncluded && match.created_by) {
        const creator = await this.userModel.findByPk(match.created_by, {
          attributes: ['id', 'name', 'email'],
        });
        if (creator) {
          scorerUsers.unshift({
            id: creator.id,
            name: creator.name,
            email: creator.email,
          });
        }
      }
    } else {
      const scorers = await this.matchScorerModel.findAll({
        where: { match_id: id },
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      });
      scorerUsers = scorers.map((s) => ({
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
      }));
    }

    const busyMatches = await this.matchModel.findAll({
      where: {
        status: 'live',
        active_scorer_id: { [Op.in]: scorerUsers.map((s) => s.id) },
        id: { [Op.ne]: id },
      },
      attributes: ['active_scorer_id'],
    });
    const busyScorerIds = new Set(busyMatches.map((m) => m.active_scorer_id));

    const enriched = scorerUsers.map((s) => ({
      ...s,
      isBusy: busyScorerIds.has(s.id),
    }));

    return successResponse('Scorers retrieved', enriched);
  }

  async addScorer(
    dto: AddMatchScorerDto,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    const match = await this.matchModel.findByPk(dto.match_id);
    if (!match) throw new NotFoundException('Match not found');
    if (match.tournament_id)
      throw new BadRequestException(
        'Cannot add individual scorers to a tournament match',
      );
    if (match.created_by !== userId)
      throw new ForbiddenException('Only the match creator can add scorers');

    const userToAdd = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (!userToAdd)
      throw new NotFoundException('User with this email not found');
    if (!userToAdd.is_email_verified)
      throw new BadRequestException('User email is not verified');
    if (userToAdd.id === match.created_by)
      throw new BadRequestException('User is already the default scorer');

    const existingCount = await this.matchScorerModel.count({
      where: { match_id: dto.match_id },
    });
    if (existingCount >= 2)
      throw new BadRequestException(
        'Maximum 2 additional scorers allowed per match',
      );

    const teamPlayers = await this.teamPlayerModel.findAll({
      where: { team_id: { [Op.in]: [match.team_a_id, match.team_b_id] } },
      include: [{ model: Player, attributes: ['id', 'user_id'] }],
    });

    const isPlayer = teamPlayers.some(
      (tp) =>
        (tp as TeamPlayer & { player?: Player }).player?.user_id ===
        userToAdd.id,
    );
    if (isPlayer) {
      throw new BadRequestException(
        'A participating player cannot act as scorer in the same match',
      );
    }

    try {
      await this.matchScorerModel.create({
        match_id: dto.match_id,
        user_id: userToAdd.id,
      });
    } catch (error) {
      if (
        (error as { name?: string }).name === 'SequelizeUniqueConstraintError'
      ) {
        throw new BadRequestException(
          'User is already a scorer for this match',
        );
      }
      throw error;
    }

    return successResponse('Scorer added successfully', null);
  }

  async removeScorer(
    dto: RemoveMatchScorerDto,
    userId: number,
  ): Promise<SuccessResponse<null>> {
    const match = await this.matchModel.findByPk(dto.match_id);
    if (!match) throw new NotFoundException('Match not found');
    if (match.tournament_id)
      throw new BadRequestException(
        'Cannot remove individual scorers from a tournament match',
      );
    if (match.created_by !== userId)
      throw new ForbiddenException('Only the match creator can remove scorers');

    if (match.created_by === dto.user_id) {
      throw new BadRequestException(
        'Cannot remove the match creator from scorers',
      );
    }

    await this.matchScorerModel.destroy({
      where: { match_id: dto.match_id, user_id: dto.user_id },
    });

    if (match.active_scorer_id === dto.user_id) {
      await match.update({ active_scorer_id: match.created_by });
    }

    return successResponse('Scorer removed successfully', null);
  }
}
