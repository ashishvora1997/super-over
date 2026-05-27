import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { MatchController } from './match.controller';
import { MatchService } from './match.service';

import { Match } from './models/match.model';
import { Tournament } from '../tournament/models/tournament.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';
import { Player } from '../players/models/players.model';
import { Team } from '../teams/models/teams.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Rules } from '../tournament/models/rules.model';
import { MatchScorer } from './models/match-scorer.model';
import { TournamentScorer } from '../tournament/models/tournament-scorer.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Match,
      Tournament,
      TournamentTeam,
      Player,
      Team,
      TeamPlayer,
      Rules,
      MatchScorer,
      TournamentScorer,
      User,
    ]),
  ],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
