import { randomBytes, createHash } from 'crypto';

export function generateOTP(): string {
  const buffer = randomBytes(4);
  const randomNum = buffer.readUInt32BE(0);
  const otp = (randomNum % 900000) + 100000;
  return otp.toString();
}

export function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

export function verifyOTP(plainOTP: string, hashedOTP: string): boolean {
  const hashedInput = hashOTP(plainOTP);
  return hashedInput === hashedOTP;
}

export function getOTPExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

export function isOTPExpired(expiryDate: Date): boolean {
  return new Date() > new Date(expiryDate);
}

export function getResendResetTime(): Date {
  return new Date(Date.now() + 30 * 60 * 1000);
}

export function hasResendLimitReset(resetTime: Date | null): boolean {
  if (!resetTime) return true;
  return new Date() > new Date(resetTime);
}

export function getRemainingResendAttempts(
  currentCount: number,
  maxAttempts: number = 3,
): number {
  return Math.max(0, maxAttempts - currentCount);
}
