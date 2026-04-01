import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from './players.model';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SequelizeModule.forFeature([Player]), AuthModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
