import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tournament } from './tournament.model';
import { TournamentTeam } from './tournament-team.model';

@Module({
  imports: [SequelizeModule.forFeature([Tournament, TournamentTeam])],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
