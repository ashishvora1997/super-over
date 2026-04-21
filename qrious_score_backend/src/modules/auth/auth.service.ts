import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

import { PasswordReset } from './password-reset.model';
import { InjectModel } from '@nestjs/sequelize';
import { EmailService } from 'src/email/email.service';

import { SuccessResponse } from 'src/common/types/response.type';
import { AuthResponse } from 'src/common/types/auth-response.type';
import { successResponse } from 'src/common/utils/response.util';
import { TokenUser } from './interfaces/token-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,

    @InjectModel(PasswordReset)
    private passwordResetModel: typeof PasswordReset,

    private readonly emailService: EmailService,
  ) {}

  private generateToken(user: TokenUser): string {
    return this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async register(data: RegisterDto): Promise<SuccessResponse<AuthResponse>> {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.createUser({
      ...data,
      password: hashedPassword,
      role: 'viewer',
    });

    const token = this.generateToken({
      id: user.id!,
      email: user.email,
      role: user.role,
    });

    return successResponse('User registered successfully', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  }

  async login(data: LoginDto): Promise<SuccessResponse<AuthResponse>> {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken({
      id: user.id!,
      email: user.email,
      role: user.role,
    });

    return successResponse('Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  }

  async forgotPassword(
    data: ForgotPasswordDto,
  ): Promise<SuccessResponse<null>> {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.passwordResetModel.destroy({
      where: { user_id: user.id },
    });

    await this.passwordResetModel.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetLink = `http://localhost:3001/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    return successResponse('Password reset link sent to your email', null);
  }

  async resetPassword(data: ResetPasswordDto): Promise<SuccessResponse<null>> {
    const { token, password } = data;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.passwordResetModel.findOne({
      where: { token_hash: tokenHash },
    });

    if (!resetRecord || resetRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.usersService.findById(resetRecord.user_id);

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword });

    await this.passwordResetModel.destroy({
      where: { user_id: user.id },
    });

    return successResponse('Password has been reset successfully', null);
  }
}
