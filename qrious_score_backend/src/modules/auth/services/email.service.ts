import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import { getOTPEmailTemplate } from 'src/common/templates/otp-email.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),

      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private get fromAddress(): string {
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'Qrious Score',
    );

    const fromEmail = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@qriousscore.com',
    );

    return `"${fromName}" <${fromEmail}>`;
  }

  async sendOTPEmail(
    toEmail: string,
    userName: string,
    otpCode: string,
  ): Promise<void> {
    this.logger.log(`Sending OTP email to ${toEmail}`);

    try {
      const htmlTemplate = getOTPEmailTemplate(userName, otpCode);

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject: 'Your verification code',
        html: htmlTemplate,
      });

      this.logger.log(`OTP email sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${toEmail}`, err);
      throw err;
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    this.logger.log(`Sending password reset email to ${toEmail}`);

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject: 'Reset Your Password',

        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Password Reset</h2>

            <p>
              Click the button below to reset your password:
            </p>

            <a
              href="${resetLink}"
              style="
                display:inline-block;
                padding:10px 20px;
                background:#1e40af;
                color:white;
                text-decoration:none;
                border-radius:5px;
              "
            >
              Reset Password
            </a>

            <p>
              This link will expire in 15 minutes.
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${toEmail}`,
        err,
      );

      throw err;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
