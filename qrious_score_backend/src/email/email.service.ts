import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendPasswordResetEmail(to: string, resetLink: string) {
    console.log('sent to::', to);
    await this.transporter.sendMail({
      from: `"Qrious Score" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Password Reset</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" 
             style="display:inline-block;padding:10px 20px;background:#1e40af;color:white;text-decoration:none;border-radius:5px;">
             Reset Password
          </a>
          <p>This link will expire in 15 minutes.</p>
        </div>
      `,
    });
  }
}
