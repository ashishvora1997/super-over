import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BallEventController } from './ball-event.controller';
import { BallEventService } from './ball-event.service';
import { BallEvent } from './models/ball-event.model';
import { Innings } from '../innings/models/innings.model';
import { Match } from '../match/models/match.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { PointsTableModule } from '../points-table/points-table.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BallEvent, Innings, Match, TeamPlayer]),
    PointsTableModule,
  ],
  controllers: [BallEventController],
  providers: [BallEventService],
  exports: [BallEventService],
})
export class BallEventModule {}
