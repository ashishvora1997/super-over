import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team } from './teams.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { TeamPlayer } from './team-player.model';

@Module({
  imports: [SequelizeModule.forFeature([Team, TeamPlayer])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
