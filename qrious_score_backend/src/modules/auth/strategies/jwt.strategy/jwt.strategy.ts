import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';

import { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { User } from 'src/modules/users/models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User) private userModel: typeof User,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'is_email_verified'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_email_verified) {
      throw new ForbiddenException('Please verify your email first');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
    };
  }
}
