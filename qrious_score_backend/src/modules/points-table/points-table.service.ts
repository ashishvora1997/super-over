import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

import { PointsTable } from './models/points-table.model';
import { Match } from '../match/models/match.model';
import { Innings } from '../innings/models/innings.model';
import { Team } from '../teams/models/teams.model';

import { successResponse } from 'src/common/utils/response.util';
import { SuccessResponse } from 'src/common/types/response.type';

@Injectable()
export class PointsTableService {
  constructor(
    @InjectModel(PointsTable)
    private readonly pointsTableModel: typeof PointsTable,

    @InjectModel(Match)
    private readonly matchModel: typeof Match,

    @InjectModel(Innings)
    private readonly inningsModel: typeof Innings,
  ) {}

  async initializeForTournament(
    tournamentId: number,
    teamIds: number[],
    transaction?: Transaction,
  ): Promise<void> {
    await this.pointsTableModel.destroy({
      where: { tournament_id: tournamentId },
      transaction,
    });

    const payload = teamIds.map((teamId) => ({
      tournament_id: tournamentId,
      team_id: teamId,
      matches_played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      no_results: 0,
      points: 0,
      runs_scored: 0,
      balls_faced: 0,
      runs_conceded: 0,
      balls_bowled: 0,
      net_run_rate: null,
    }));

    await this.pointsTableModel.bulkCreate(payload, { transaction });
  }

  async updateFromMatch(
    matchId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const match = await this.matchModel.findByPk(matchId, { transaction });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== 'completed') {
      throw new BadRequestException(
        'Cannot update points table: match is not completed',
      );
    }

    const teamARow = await this.findOrCreateRow(
      match.tournament_id,
      match.team_a_id,
      transaction,
    );

    const teamBRow = await this.findOrCreateRow(
      match.tournament_id,
      match.team_b_id,
      transaction,
    );

    teamARow.matches_played += 1;
    teamBRow.matches_played += 1;

    if (match.winner_team_id) {
      if (match.winner_team_id === match.team_a_id) {
        teamARow.wins += 1;
        teamARow.points += 2;
        teamBRow.losses += 1;
      } else {
        teamBRow.wins += 1;
        teamBRow.points += 2;
        teamARow.losses += 1;
      }
    } else if (match.result === 'no_result') {
      teamARow.no_results += 1;
      teamARow.points += 1;
      teamBRow.no_results += 1;
      teamBRow.points += 1;
    } else if (match.result === 'tie' || match.result === 'draw') {
      teamARow.ties += 1;
      teamARow.points += 1;
      teamBRow.ties += 1;
      teamBRow.points += 1;
    } else if (match.result === 'super_over') {
      teamARow.matches_played -= 1;
      teamBRow.matches_played -= 1;
    } else {
      teamARow.ties += 1;
      teamARow.points += 1;
      teamBRow.ties += 1;
      teamBRow.points += 1;
    }

    await this.updateNrrAccumulators(
      match,
      teamARow,
      teamBRow,
      'add',
      transaction,
    );

    this.recalculateNrr(teamARow);
    this.recalculateNrr(teamBRow);

    await teamARow.save({ transaction });
    await teamBRow.save({ transaction });
  }

  async reverseFromMatch(
    matchId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const match = await this.matchModel.findByPk(matchId, { transaction });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const teamARow = await this.pointsTableModel.findOne({
      where: {
        tournament_id: match.tournament_id,
        team_id: match.team_a_id,
      },
      transaction,
    });

    const teamBRow = await this.pointsTableModel.findOne({
      where: {
        tournament_id: match.tournament_id,
        team_id: match.team_b_id,
      },
      transaction,
    });

    if (!teamARow || !teamBRow) {
      return;
    }

    teamARow.matches_played = Math.max(0, teamARow.matches_played - 1);
    teamBRow.matches_played = Math.max(0, teamBRow.matches_played - 1);

    if (match.winner_team_id) {
      if (match.winner_team_id === match.team_a_id) {
        teamARow.wins = Math.max(0, teamARow.wins - 1);
        teamARow.points = Math.max(0, teamARow.points - 2);
        teamBRow.losses = Math.max(0, teamBRow.losses - 1);
      } else {
        teamBRow.wins = Math.max(0, teamBRow.wins - 1);
        teamBRow.points = Math.max(0, teamBRow.points - 2);
        teamARow.losses = Math.max(0, teamARow.losses - 1);
      }
    } else if (match.result === 'no_result') {
      teamARow.no_results = Math.max(0, teamARow.no_results - 1);
      teamARow.points = Math.max(0, teamARow.points - 1);
      teamBRow.no_results = Math.max(0, teamBRow.no_results - 1);
      teamBRow.points = Math.max(0, teamBRow.points - 1);
    } else if (match.result === 'tie' || match.result === 'draw') {
      teamARow.ties = Math.max(0, teamARow.ties - 1);
      teamARow.points = Math.max(0, teamARow.points - 1);
      teamBRow.ties = Math.max(0, teamBRow.ties - 1);
      teamBRow.points = Math.max(0, teamBRow.points - 1);
    } else if (match.result === 'super_over') {
    } else {
      teamARow.ties = Math.max(0, teamARow.ties - 1);
      teamARow.points = Math.max(0, teamARow.points - 1);
      teamBRow.ties = Math.max(0, teamBRow.ties - 1);
      teamBRow.points = Math.max(0, teamBRow.points - 1);
    }

    await this.updateNrrAccumulators(
      match,
      teamARow,
      teamBRow,
      'subtract',
      transaction,
    );

    this.recalculateNrr(teamARow);
    this.recalculateNrr(teamBRow);

    await teamARow.save({ transaction });
    await teamBRow.save({ transaction });
  }

  async getStandings(
    tournamentId: number,
  ): Promise<SuccessResponse<PointsTable[]>> {
    const standings = await this.pointsTableModel.findAll({
      where: { tournament_id: tournamentId },
      include: [
        {
          model: Team,
          attributes: ['id', 'name', 'short_name'],
        },
      ],
      order: [
        ['points', 'DESC'],
        ['wins', 'DESC'],
        ['net_run_rate', 'DESC NULLS LAST'],
      ],
    });

    return successResponse('Standings retrieved successfully', standings);
  }

  private async updateNrrAccumulators(
    match: Match,
    teamARow: PointsTable,
    teamBRow: PointsTable,
    operation: 'add' | 'subtract',
    transaction?: Transaction,
  ): Promise<void> {
    const matchInnings = await this.inningsModel.findAll({
      where: {
        match_id: match.id,
        is_super_over: false,
        innings_number: [1, 2],
      },
      transaction,
    });

    if (matchInnings.length < 2) {
      return;
    }

    const innings1 = matchInnings.find((i) => i.innings_number === 1);
    const innings2 = matchInnings.find((i) => i.innings_number === 2);

    if (!innings1 || !innings2) return;

    const innings1Balls = innings1.overs * 6 + innings1.balls;
    const innings2Balls = innings2.overs * 6 + innings2.balls;

    const battingTeam1Id = innings1.batting_team_id;
    const battingTeam2Id = innings2.batting_team_id;

    const multiplier = operation === 'add' ? 1 : -1;

    if (battingTeam1Id === match.team_a_id) {
      teamARow.runs_scored += innings1.total_runs * multiplier;
      teamARow.balls_faced += innings1Balls * multiplier;
      teamARow.runs_conceded += innings2.total_runs * multiplier;
      teamARow.balls_bowled += innings2Balls * multiplier;

      teamBRow.runs_scored += innings2.total_runs * multiplier;
      teamBRow.balls_faced += innings2Balls * multiplier;
      teamBRow.runs_conceded += innings1.total_runs * multiplier;
      teamBRow.balls_bowled += innings1Balls * multiplier;
    } else {
      teamBRow.runs_scored += innings1.total_runs * multiplier;
      teamBRow.balls_faced += innings1Balls * multiplier;
      teamBRow.runs_conceded += innings2.total_runs * multiplier;
      teamBRow.balls_bowled += innings2Balls * multiplier;

      teamARow.runs_scored += innings2.total_runs * multiplier;
      teamARow.balls_faced += innings2Balls * multiplier;
      teamARow.runs_conceded += innings1.total_runs * multiplier;
      teamARow.balls_bowled += innings1Balls * multiplier;
    }

    if (operation === 'subtract') {
      teamARow.runs_scored = Math.max(0, teamARow.runs_scored);
      teamARow.balls_faced = Math.max(0, teamARow.balls_faced);
      teamARow.runs_conceded = Math.max(0, teamARow.runs_conceded);
      teamARow.balls_bowled = Math.max(0, teamARow.balls_bowled);
      teamBRow.runs_scored = Math.max(0, teamBRow.runs_scored);
      teamBRow.balls_faced = Math.max(0, teamBRow.balls_faced);
      teamBRow.runs_conceded = Math.max(0, teamBRow.runs_conceded);
      teamBRow.balls_bowled = Math.max(0, teamBRow.balls_bowled);
    }
  }

  private recalculateNrr(row: PointsTable): void {
    if (row.balls_faced === 0 || row.balls_bowled === 0) {
      row.net_run_rate = null;
      return;
    }

    const oversFaced = row.balls_faced / 6;
    const oversBowled = row.balls_bowled / 6;

    const scoringRate = row.runs_scored / oversFaced;
    const concedingRate = row.runs_conceded / oversBowled;

    row.net_run_rate = parseFloat((scoringRate - concedingRate).toFixed(3));
  }

  private async findOrCreateRow(
    tournamentId: number,
    teamId: number,
    transaction?: Transaction,
  ): Promise<PointsTable> {
    const [row] = await this.pointsTableModel.findOrCreate({
      where: {
        tournament_id: tournamentId,
        team_id: teamId,
      },
      defaults: {
        tournament_id: tournamentId,
        team_id: teamId,
        matches_played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        no_results: 0,
        points: 0,
        runs_scored: 0,
        balls_faced: 0,
        runs_conceded: 0,
        balls_bowled: 0,
        net_run_rate: null,
      },
      transaction,
    });

    return row;
  }
}
