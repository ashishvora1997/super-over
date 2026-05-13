import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
import { EmailService } from './services/email.service';

import { SuccessResponse } from 'src/common/types/response.type';
import { AuthResponse } from 'src/common/types/auth-response.type';
import { successResponse } from 'src/common/utils/response.util';
import { TokenUser } from './interfaces/token-user.interface';

import {
  generateOTP,
  hashOTP,
  getOTPExpiry,
  isOTPExpired,
  getResendResetTime,
  hasResendLimitReset,
  getRemainingResendAttempts,
} from './utils/otp.utils';

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

  async register(
    data: RegisterDto,
  ): Promise<SuccessResponse<{ userId: number; email: string }>> {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.createUser({
      ...data,
      password: hashedPassword,
      role: 'viewer',
      is_email_verified: false,
    });

    await this.sendOTPToUser(user.id!, user.email, user.name);

    return successResponse('OTP sent to your email', {
      userId: user.id,
      email: user.email,
    });
  }

  private async sendOTPToUser(
    userId: number,
    email: string,
    name: string,
  ): Promise<void> {
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    await this.usersService.updateUserOTP(userId, {
      email_otp: hashedOTP,
      email_otp_expires_at: otpExpiry,
    });

    this.emailService.sendOTPEmail(email, name, otp).catch((err) => {
      console.error('Failed to send OTP email:', err);
    });
  }

  async login(
    data: LoginDto,
  ): Promise<
    SuccessResponse<
      AuthResponse | { userId: number; email: string; needsVerification: true }
    >
  > {
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

    if (!user.email_otp || !user.email_otp_expires_at) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (isOTPExpired(user.email_otp_expires_at)) {
      throw new BadRequestException('OTP expired, please resend');
    }

    const hashedInput = hashOTP(data.otp);
    if (hashedInput !== user.email_otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.usersService.clearUserOTP(user.id!, {
      is_email_verified: true,
      email_otp: null,
      email_otp_expires_at: null,
      email_otp_resend_count: 0,
      email_otp_resend_reset_at: null,
    });

    const token = this.generateToken({
      id: user.id!,
      email: user.email,
      role: user.role,
    });

    return successResponse('Email verified successfully', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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

    if (!hasResendLimitReset(user.email_otp_resend_reset_at)) {
      const retryAfter = Math.ceil(
        (new Date(user.email_otp_resend_reset_at!).getTime() - Date.now()) /
          60000,
      );

      throw new ForbiddenException({
        message: `Too many attempts, try after ${retryAfter} minutes`,
        remainingAttempts: 0,
        retryAfter,
      });
    }

    let newCount = user.email_otp_resend_count;
    let newResetTime = user.email_otp_resend_reset_at;
    if (hasResendLimitReset(user.email_otp_resend_reset_at)) {
      newCount = 0;
      newResetTime = getResendResetTime();
    }

    if (newCount >= 3) {
      throw new ForbiddenException({
        message: 'Too many attempts, try after 30 minutes',
        remainingAttempts: 0,
        retryAfter: 30,
      });
    }

    newCount += 1;

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    await this.usersService.updateUserOTP(data.userId, {
      email_otp: hashedOTP,
      email_otp_expires_at: otpExpiry,
      email_otp_resend_count: newCount,
      email_otp_resend_reset_at: newResetTime,
    });

    await this.emailService.sendOTPEmail(user.email, user.name, otp);

    const remainingAttempts = getRemainingResendAttempts(newCount);

    return successResponse('OTP resent', {
      message: 'OTP resent successfully',
      expiresIn: 600,
      remainingAttempts,
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
