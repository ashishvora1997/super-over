import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Match } from './models/match.model';
import { Tournament } from '../tournament/models/tournament.model';
import { TournamentTeam } from '../tournament/models/tournament-team.model';

@Module({
  imports: [SequelizeModule.forFeature([Match, Tournament, TournamentTeam])],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
