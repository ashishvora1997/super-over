import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Player } from '../players/models/players.model';
import { BallEvent } from '../ball-event/models/ball-event.model';
import { Match } from '../match/models/match.model';
import { Team } from '../teams/models/teams.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { Innings } from '../innings/models/innings.model';
import { Tournament } from '../tournament/models/tournament.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Player,
      BallEvent,
      Match,
      Team,
      TeamPlayer,
      Innings,
      Tournament,
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
