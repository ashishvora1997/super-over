import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

import { EmailService } from './services/email.service';

import { SuccessResponse } from 'src/common/types/response.type';
import { AuthResponse } from 'src/common/types/auth-response.type';
import { successResponse } from 'src/common/utils/response.util';

import { TokenUser } from './interfaces/token-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { generateOTP, hashOTP } from './utils/otp.utils';

import { RedisService } from 'src/redis/redis.service';

import {
  emailVerificationKey,
  passwordResetKey,
  resendAttemptsKey,
} from './auth.redis-keys';

import {
  ACCESS_TOKEN_EXPIRY,
  MAX_RESEND_ATTEMPTS,
  OTP_EXPIRY_SECONDS,
  PASSWORD_RESET_EXPIRY_SECONDS,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRY_DAYS,
  RESEND_OTP_BLOCK_SECONDS,
} from './auth.constants';

import { UserSessionModel } from './models/user-session.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,

    @InjectModel(UserSessionModel)
    private readonly userSessionModel: typeof UserSessionModel,
  ) {}

  private generateToken(user: TokenUser): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    );
  }

  private setRefreshTokenCookie(res: ExpressResponse, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: ExpressResponse): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  private generateRefreshToken(): { rawToken: string; hashedToken: string } {
    const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    return {
      rawToken,
      hashedToken,
    };
  }

  private getRefreshTokenExpiry(): Date {
    return new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  private async sendOTPToUser(
    userId: number,
    email: string,
    name: string,
  ): Promise<void> {
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    const redisKey = emailVerificationKey(userId);

    await this.redisService.set(
      redisKey,
      JSON.stringify({
        otpHash: hashedOTP,
      }),
      OTP_EXPIRY_SECONDS,
    );

    this.emailService.sendOTPEmail(email, name, otp).catch((err) => {
      console.error('Failed to send OTP email:', err);
    });
  }

  async register(
    data: RegisterDto,
  ): Promise<SuccessResponse<{ userId: number; email: string }>> {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      if (!existingUser.is_email_verified) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        await existingUser.update({
          password: hashedPassword,
          name: data.name,
        });

        await this.sendOTPToUser(
          existingUser.id!,
          existingUser.email,
          data.name,
        );

        return successResponse(
          'An account with this email already exists but is not verified. A new verification code has been sent.',
          {
            userId: existingUser.id!,
            email: existingUser.email,
          },
        );
      }

      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.createUser({
      ...data,
      password: hashedPassword,
      is_email_verified: false,
    });

    await this.sendOTPToUser(user.id!, user.email, user.name);

    return successResponse('OTP sent to your email', {
      userId: user.id!,
      email: user.email,
    });
  }

  async login(
    data: LoginDto,
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<SuccessResponse<AuthResponse>> {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_email_verified) {
      await this.sendOTPToUser(user.id!, user.email, user.name);

      throw new ForbiddenException({
        message: 'Email not verified',
        userId: user.id,
        email: user.email,
        needsVerification: true,
      });
    }

    const accessToken = this.generateToken({
      id: user.id!,
      email: user.email,
    });

    const { rawToken, hashedToken } = this.generateRefreshToken();

    await this.userSessionModel.create({
      user_id: user.id!,
      refresh_token_hash: hashedToken,
      expires_at: this.getRefreshTokenExpiry(),
      user_agent: req.headers['user-agent'] || null,
      ip_address: req.ip || null,
    });

    this.setRefreshTokenCookie(res, rawToken);

    return successResponse('Login successful', {
      accessToken,
      user: {
        id: user.id!,
        email: user.email,
        name: user.name,
        is_email_verified: user.is_email_verified,
        is_profile_complete: user.is_profile_complete,
      },
    });
  }

  async verifyEmail(data: {
    userId: number;
    otp: string;
  }): Promise<SuccessResponse<AuthResponse>> {
    const user = await this.usersService.findById(data.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_email_verified) {
      throw new BadRequestException('Email already verified');
    }

    const redisKey = emailVerificationKey(data.userId);

    const stored = await this.redisService.get(redisKey);

    if (!stored) {
      throw new BadRequestException(
        'OTP expired or not found. Please request a new one.',
      );
    }

    const { otpHash } = JSON.parse(stored);

    const hashedInput = hashOTP(data.otp);

    if (hashedInput !== otpHash) {
      throw new BadRequestException('Invalid OTP');
    }

    await user.update({ is_email_verified: true });

    await this.redisService.del(redisKey);

    const accessToken = this.generateToken({
      id: user.id!,
      email: user.email,
    });

    return successResponse('Email verified successfully', {
      accessToken,
      user: {
        id: user.id!,
        email: user.email,
        name: user.name,
        is_email_verified: true,
        is_profile_complete: user.is_profile_complete,
      },
    });
  }

  async resendOTP(data: { userId: number }): Promise<
    SuccessResponse<{
      message: string;
      expiresIn: number;
      remainingAttempts: number;
    }>
  > {
    const user = await this.usersService.findById(data.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_email_verified) {
      throw new BadRequestException('Email already verified');
    }

    const rateLimitKey = resendAttemptsKey(user.id!);

    const current = await this.redisService.get(rateLimitKey);

    const count = current ? parseInt(current) : 0;

    if (count >= MAX_RESEND_ATTEMPTS) {
      throw new ForbiddenException({
        message: 'Too many attempts, try after 30 minutes',
        remainingAttempts: 0,
        retryAfter: RESEND_OTP_BLOCK_SECONDS / 60,
      });
    }

    await this.sendOTPToUser(user.id!, user.email, user.name);

    const newCount = count + 1;

    await this.redisService.set(
      rateLimitKey,
      String(newCount),
      RESEND_OTP_BLOCK_SECONDS,
    );

    return successResponse('OTP resent', {
      message: 'OTP resent successfully',
      expiresIn: OTP_EXPIRY_SECONDS,
      remainingAttempts: MAX_RESEND_ATTEMPTS - newCount,
    });
  }

  async forgotPassword(
    data: ForgotPasswordDto,
  ): Promise<SuccessResponse<null>> {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      return successResponse(
        'If the account exists, reset instructions have been sent.',
        null,
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.redisService.set(
      passwordResetKey(tokenHash),
      JSON.stringify({
        userId: user.id,
      }),
      PASSWORD_RESET_EXPIRY_SECONDS,
    );

    const resetLink = `http://localhost:3001/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    return successResponse('Password reset link sent to your email', null);
  }

  async resetPassword(data: ResetPasswordDto): Promise<SuccessResponse<null>> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(data.token)
      .digest('hex');

    const stored = await this.redisService.get(passwordResetKey(tokenHash));

    if (!stored) {
      throw new BadRequestException('Invalid or expired token');
    }

    const { userId } = JSON.parse(stored);

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await user.update({ password: hashedPassword });

    await this.redisService.del(passwordResetKey(tokenHash));

    return successResponse('Password has been reset successfully', null);
  }

  async refresh(
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<SuccessResponse<{ accessToken: string }>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.userSessionModel.findOne({
      where: {
        refresh_token_hash: refreshTokenHash,
        is_revoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expires_at < new Date()) {
      await session.update({ is_revoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(session.user_id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateToken({
      id: user.id!,
      email: user.email,
    });

    const { rawToken, hashedToken } = this.generateRefreshToken();

    await session.update({
      refresh_token_hash: hashedToken,
      expires_at: this.getRefreshTokenExpiry(),
    });

    this.setRefreshTokenCookie(res, rawToken);

    return successResponse('Token refreshed successfully', {
      accessToken,
    });
  }

  async logout(
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<SuccessResponse<null>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.userSessionModel.findOne({
      where: {
        refresh_token_hash: refreshTokenHash,
        is_revoked: false,
      },
    });

    if (session) {
      await session.update({ is_revoked: true });
    }

    this.clearRefreshTokenCookie(res);

    return successResponse('Logout successful', null);
  }

  async logoutAllDevices(
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<SuccessResponse<null>> {
    const user = req.user as JwtPayload;

    if (!user?.sub) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.userSessionModel.update(
      { is_revoked: true },
      {
        where: {
          user_id: user.sub,
          is_revoked: false,
        },
      },
    );

    this.clearRefreshTokenCookie(res);

    return successResponse('Logged out from all devices successfully', null);
  }
}
