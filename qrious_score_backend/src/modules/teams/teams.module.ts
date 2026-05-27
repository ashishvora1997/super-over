import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team } from './models/teams.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { TeamPlayer } from './models/team-player.model';
import { Player } from '../players/models/players.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Team,
      TeamPlayer,
      Player,
      TournamentTeam,
      User,
    ]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
