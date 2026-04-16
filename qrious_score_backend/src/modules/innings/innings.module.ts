import { Module } from '@nestjs/common';
import { InningsController } from './innings.controller';
import { InningsService } from './innings.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Innings } from './models/innings.model';
import { Toss } from '../toss/models/toss.model';
import { Match } from '../match/models/match.model';
import { TeamPlayer } from '../teams/models/team-player.model';

@Module({
  imports: [SequelizeModule.forFeature([Innings, Toss, Match, TeamPlayer])],
  controllers: [InningsController],
  providers: [InningsService],
  exports: [InningsService],
})
export class InningsModule {}
