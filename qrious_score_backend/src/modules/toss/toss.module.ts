import { Module } from '@nestjs/common';
import { TossController } from './toss.controller';
import { TossService } from './toss.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Toss } from './models/toss.model';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';

@Module({
  imports: [SequelizeModule.forFeature([Toss, Innings, Match])],
  controllers: [TossController],
  providers: [TossService],
  exports: [TossService],
})
export class TossModule {}
