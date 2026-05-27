import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { UsersModule } from '../users/users.module';
import { EmailService } from './services/email.service';
import { User } from '../users/models/user.model';
import { UserSessionModel } from './models/user-session.model';

@Module({
  imports: [
    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),

    UsersModule,
    SequelizeModule.forFeature([User, UserSessionModel]),
  ],
  providers: [AuthService, EmailService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}
