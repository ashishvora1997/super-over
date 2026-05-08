import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tournament } from './models/tournament.model';
import { TournamentTeam } from './models/tournament-team.model';
import { PointsTableModule } from '../points-table/points-table.module';
import { Team } from '../teams/models/teams.model';
import { Player } from '../players/models/players.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Tournament, TournamentTeam, Team, Player]),
    PointsTableModule,
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
