/**
 * RAZY PAY Authorized Administrator Configuration
 */
export const AUTHORIZED_ADMIN_EMAIL = 'chandankumarsundro312@gmail.com';
export const AUTHORIZED_ADMIN_PHONE = '7549545333';

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}
