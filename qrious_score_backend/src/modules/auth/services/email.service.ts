import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import { getOTPEmailTemplate } from 'src/common/templates/otp-email.template';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT', 587));
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,

      auth: {
        user,
        pass,
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
      this.configService.get<string>('SMTP_USER'),
    );

    return `"${fromName}" <${fromEmail}>`;
  }

  async sendOTPEmail(
    toEmail: string,
    userName: string,
    otpCode: string,
  ): Promise<void> {
    try {
      const htmlTemplate = getOTPEmailTemplate(userName, otpCode);

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject: 'Your verification code',
        html: htmlTemplate,
      });
    } catch (err) {
      throw err;
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
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
    } catch (err) {
      throw err;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();

      return true;
    } catch (err) {
      return false;
    }
  }
}
