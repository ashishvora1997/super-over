import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { InningsController } from './innings.controller';
import { InningsService } from './innings.service';

import { Innings } from './models/innings.model';
import { Toss } from '../toss/models/toss.model';
import { Match } from '../match/models/match.model';
import { TeamPlayer } from '../teams/models/team-player.model';
import { MatchScorer } from '../match/models/match-scorer.model';
import { TournamentScorer } from '../tournament/models/tournament-scorer.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Innings,
      Toss,
      Match,
      TeamPlayer,
      MatchScorer,
      TournamentScorer,
    ]),
  ],
  controllers: [InningsController],
  providers: [InningsService],
  exports: [InningsService],
})
export class InningsModule {}
