export const ADMIN_EMAIL = 'jiankn@gmail.com';

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function isAdminEmail(email) {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}
