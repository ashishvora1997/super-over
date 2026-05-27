export const emailVerificationKey = (userId: number) =>
  `email_verification:${userId}`;

export const resendAttemptsKey = (userId: number) =>
  `email_verification_resend:${userId}`;

export const passwordResetKey = (tokenHash: string) =>
  `password_reset:${tokenHash}`;
