import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tournament } from './models/tournament.model';
import { TournamentTeam } from './models/tournament-team.model';
import { TournamentScorer } from './models/tournament-scorer.model';
import { Rules } from './models/rules.model';
import { PointsTableModule } from '../points-table/points-table.module';
import { Team } from '../teams/models/teams.model';
import { Player } from '../players/models/players.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { User } from '../users/models/user.model';
import { Match } from '../match/models/match.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Tournament,
      TournamentTeam,
      TournamentScorer,
      Rules,
      Team,
      Player,
      TeamPlayer,
      User,
      Match,
    ]),
    PointsTableModule,
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
