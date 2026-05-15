import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from './models/players.model';

import { AuthModule } from '../auth/auth.module';
import { User } from '../users/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Player, User]), AuthModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
