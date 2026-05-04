import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PointsTableController } from './points-table.controller';
import { PointsTableService } from './points-table.service';
import { PointsTable } from './models/points-table.model';
import { Match } from '../match/models/match.model';
import { Innings } from '../innings/models/innings.model';

@Module({
  imports: [SequelizeModule.forFeature([PointsTable, Match, Innings])],
  controllers: [PointsTableController],
  providers: [PointsTableService],
  exports: [PointsTableService],
})
export class PointsTableModule {}
