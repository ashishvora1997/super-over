import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { successResponse } from 'src/common/utils/response.util';
import { SuccessResponse } from 'src/common/types/response.type';
import { Player } from '../players/models/players.model';
import { BallEvent } from '../ball-event/models/ball-event.model';
import { col, fn, literal, Op } from 'sequelize';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';
import { Team } from '../teams/models/teams.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Tournament } from '../tournament/models/tournament.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Player)
    private playerModel: typeof Player,

    @InjectModel(BallEvent)
    private ballEventModel: typeof BallEvent,

    @InjectModel(Match)
    private matchModel: typeof Match,

    @InjectModel(Team)
    private teamModel: typeof Team,

    @InjectModel(TeamPlayer)
    private teamPlayerModel: typeof TeamPlayer,

    @InjectModel(Innings)
    private inningsModel: typeof Innings,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }

  async getAllUsers(page = 1, limit = 10): Promise<SuccessResponse<User[]>> {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.userModel.findAndCountAll({
      attributes: ['id', 'name', 'email'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse('Users retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async getCurrentUser(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: [
        'id',
        'name',
        'email',
        'is_email_verified',
        'is_profile_complete',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return successResponse('User fetched successfully', {
      user,
    });
  }

  async updateUserOTP(
    id: number,
    data: {
      email_otp: string;
      email_otp_expires_at: Date;
      email_otp_resend_count?: number;
      email_otp_resend_reset_at?: Date | null;
    },
  ): Promise<void> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update({
      email_otp: data.email_otp,
      email_otp_expires_at: data.email_otp_expires_at,
      ...(data.email_otp_resend_count !== undefined && {
        email_otp_resend_count: data.email_otp_resend_count,
      }),
      ...(data.email_otp_resend_reset_at !== undefined && {
        email_otp_resend_reset_at: data.email_otp_resend_reset_at,
      }),
    });
  }

  async clearUserOTP(
    id: number,
    data: {
      is_email_verified?: boolean;
      email_otp?: string | null;
      email_otp_expires_at?: Date | null;
      email_otp_resend_count?: number;
      email_otp_resend_reset_at?: Date | null;
    },
  ): Promise<void> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update({
      ...(data.is_email_verified !== undefined && {
        is_email_verified: data.is_email_verified,
      }),
      ...(data.email_otp !== undefined && { email_otp: data.email_otp }),
      ...(data.email_otp_expires_at !== undefined && {
        email_otp_expires_at: data.email_otp_expires_at,
      }),
      ...(data.email_otp_resend_count !== undefined && {
        email_otp_resend_count: data.email_otp_resend_count,
      }),
      ...(data.email_otp_resend_reset_at !== undefined && {
        email_otp_resend_reset_at: data.email_otp_resend_reset_at,
      }),
    });
  }

  async getDashboardData(id: string) {
    const player = await this.playerModel.findOne({ where: { user_id: id } });
    if (!player) return null;

    const careerInclude = [
      {
        model: Innings,
        attributes: [],
        required: true,
        include: [
          {
            model: Match,
            attributes: [],
            required: true,
            where: { status: 'completed' },
          },
        ],
      },
    ];

    const [battingResult] = (await this.ballEventModel.findAll({
      attributes: [
        [fn('SUM', col('BallEvent.runs_bat')), 'total_runs'],
        [
          fn(
            'COUNT',
            literal(
              'CASE WHEN is_wicket = true AND dismissed_player_id = ' +
                player.id +
                ' THEN 1 END',
            ),
          ),
          'dismissals',
        ],
        [
          fn(
            'COUNT',
            literal("CASE WHEN extra_type IS DISTINCT FROM 'wide' THEN 1 END"),
          ),
          'balls_faced',
        ],
      ],
      where: { striker_id: player.id },
      include: careerInclude,
      raw: true,
    })) as unknown as [
      { total_runs: string; dismissals: string; balls_faced: string },
    ];

    const runsThisSeason = Number(battingResult?.total_runs ?? 0);
    const dismissals = Number(battingResult?.dismissals ?? 0);
    const ballsFaced = Number(battingResult?.balls_faced ?? 0);
    const battingAverage = dismissals > 0 ? runsThisSeason / dismissals : 0;
    const strikeRate = ballsFaced > 0 ? (runsThisSeason / ballsFaced) * 100 : 0;

    const [wicketsResult] = (await this.ballEventModel.findAll({
      attributes: [[fn('COUNT', col('BallEvent.id')), 'wickets']],
      where: {
        bowler_id: player.id,
        is_wicket: true,
        wicket_type: { [Op.notIn]: ['run_out', 'retired_hurt'] },
      },
      include: careerInclude,
      raw: true,
    })) as unknown as [{ wickets: string }];

    const wicketsTaken = Number(wicketsResult?.wickets ?? 0);

    const teamPlayers = await this.teamPlayerModel.findAll({
      where: { player_id: player.id },
      include: [{ model: Team, attributes: ['id', 'name'] }],
    });

    const myTeams = [];
    const teamIds = [];

    for (const tp of teamPlayers) {
      if (!tp.team) continue;
      teamIds.push(tp.team_id);

      const matchCount = await this.matchModel.count({
        where: {
          status: 'completed',
          [Op.or]: [{ team_a_id: tp.team_id }, { team_b_id: tp.team_id }],
        },
      });

      myTeams.push({
        id: tp.team.id,
        name: tp.team.name,
        role: player.playing_role,
        match_count: matchCount,
      });
    }

    let myMatches = [];
    let recentForm = [];

    if (teamIds.length > 0) {
      myMatches = await this.matchModel.findAll({
        where: {
          [Op.or]: [
            { team_a_id: { [Op.in]: teamIds } },
            { team_b_id: { [Op.in]: teamIds } },
          ],
        },
        include: [
          { model: Team, as: 'teamA', attributes: ['id', 'name'] },
          { model: Team, as: 'teamB', attributes: ['id', 'name'] },
          { model: Tournament, attributes: ['id', 'name'] },
        ],
        order: [
          [
            literal(
              `CASE "Match"."status" WHEN 'live' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END`,
            ),
            'ASC',
          ],
          ['match_date', 'DESC'],
        ],
        limit: 5,
      });

      const recentMatches = await this.matchModel.findAll({
        where: {
          status: 'completed',
          [Op.or]: [
            { team_a_id: { [Op.in]: teamIds } },
            { team_b_id: { [Op.in]: teamIds } },
          ],
        },
        order: [['match_date', 'DESC']],
        limit: 5,
        include: [
          { model: Team, as: 'teamA', attributes: ['id', 'name'] },
          { model: Team, as: 'teamB', attributes: ['id', 'name'] },
        ],
      });

      recentForm = recentMatches.map((match) => {
        let result: 'W' | 'L' | 'T' | 'NR' = 'NR';
        if (match.result === 'tie') {
          result = 'T';
        } else if (match.winner_team_id) {
          result = teamIds.includes(match.winner_team_id) ? 'W' : 'L';
        }

        const isTeamA = teamIds.includes(match.team_a_id);
        const opponentName = isTeamA ? match.teamB?.name : match.teamA?.name;

        return {
          match_id: match.id,
          result,
          opponent_name: opponentName || 'Unknown',
        };
      });
    }

    let highestScore = null;
    const highestScoreResult = (await this.ballEventModel.findAll({
      attributes: ['innings_id', [fn('SUM', col('runs_bat')), 'runs']],
      where: { striker_id: player.id },
      group: ['innings_id'],
      order: [[literal('runs'), 'DESC']],
      limit: 1,
      raw: true,
    })) as unknown as { innings_id: number; runs: string }[];

    if (highestScoreResult.length > 0) {
      const bestInningsId = highestScoreResult[0].innings_id;
      const bestRuns = Number(highestScoreResult[0].runs);

      const bestInnings = await this.inningsModel.findByPk(bestInningsId, {
        include: [
          {
            model: Match,
            include: [
              { model: Team, as: 'teamA', attributes: ['name'] },
              { model: Team, as: 'teamB', attributes: ['name'] },
            ],
          },
        ],
      });

      if (bestInnings && bestInnings.match) {
        const isTeamA =
          bestInnings.batting_team_id === bestInnings.match.team_a_id;
        const opponentName = isTeamA
          ? bestInnings.match.teamB?.name
          : bestInnings.match.teamA?.name;
        highestScore = { runs: bestRuns, opponent: opponentName || 'Unknown' };
      }
    }

    let bestBowling = null;
    const bestBowlingResult = (await this.ballEventModel.findAll({
      attributes: [
        'innings_id',
        [
          fn(
            'COUNT',
            literal(
              "CASE WHEN is_wicket = true AND wicket_type NOT IN ('run_out', 'retired_hurt') THEN 1 END",
            ),
          ),
          'wickets',
        ],
        [fn('SUM', literal('runs_bat + runs_extra')), 'runs_conceded'],
      ],
      where: { bowler_id: player.id },
      group: ['innings_id'],
      order: [
        [literal('wickets'), 'DESC'],
        [literal('runs_conceded'), 'ASC'],
      ],
      limit: 1,
      raw: true,
    })) as unknown as {
      innings_id: number;
      wickets: string;
      runs_conceded: string;
    }[];

    if (
      bestBowlingResult.length > 0 &&
      Number(bestBowlingResult[0].wickets) > 0
    ) {
      const bestInningsId = bestBowlingResult[0].innings_id;
      const wickets = Number(bestBowlingResult[0].wickets);
      const runs = Number(bestBowlingResult[0].runs_conceded);

      const bestInnings = await this.inningsModel.findByPk(bestInningsId, {
        include: [
          {
            model: Match,
            include: [
              { model: Team, as: 'teamA', attributes: ['name'] },
              { model: Team, as: 'teamB', attributes: ['name'] },
            ],
          },
        ],
      });

      if (bestInnings && bestInnings.match) {
        const isTeamA =
          bestInnings.batting_team_id === bestInnings.match.team_b_id;
        const opponentName = isTeamA
          ? bestInnings.match.teamB?.name
          : bestInnings.match.teamA?.name;
        bestBowling = {
          figures: `${wickets}/${runs}`,
          opponent: opponentName || 'Unknown',
        };
      }
    }

    const catchesResult = await this.ballEventModel.count({
      where: {
        fielder_id: player.id,
        wicket_type: 'caught',
      },
    });

    return successResponse('Dashboard data fetched successfully', {
      runsThisSeason,
      battingAverage: parseFloat(battingAverage.toFixed(2)),
      strikeRate: parseFloat(strikeRate.toFixed(2)),
      wicketsTaken,
      myTeams,
      myMatches,
      recentForm,
      highlights: {
        highestScore,
        bestBowling,
        catches: catchesResult,
      },
    });
  }
}
