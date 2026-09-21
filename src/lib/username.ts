export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

// Internal domain for the email Supabase Auth requires under the hood.
// Users never see or type this — see deriveEmailForUsername below.
const DERIVED_EMAIL_DOMAIN = "vytal.local";

export function isValidUsernameFormat(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function usernameFormatErrorMessage(username: string): string | null {
  if (isValidUsernameFormat(username)) return null;
  return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters, using only letters, numbers, and underscores.`;
}

// Uniqueness (and lookups) are case-insensitive — "Alice" and "alice" are
// the same account — so every comparison goes through this first.
export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

// Deterministic in both directions: sign-up derives this once to create
// the Supabase Auth user, and sign-in re-derives the identical value from
// whatever casing was typed, since normalizeUsername() already collapses
// case before it gets here.
export function deriveEmailForUsername(username: string): string {
  return `${normalizeUsername(username)}@${DERIVED_EMAIL_DOMAIN}`;
}
