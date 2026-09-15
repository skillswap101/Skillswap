// SkillSwap 5.0 — request validation helper
// This file is intentionally small. Migrate routes to a schema validator such as Zod/Valibot.
// Do not treat this helper as a substitute for route-specific validation.

export function requireNonEmptyString(value: unknown, field: string, maxLength = 1000): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const v = value.trim();
  if (!v) throw new Error(`${field} is required`);
  if (v.length > maxLength) throw new Error(`${field} is too long`);
  return v;
}

export function requirePositiveFiniteNumber(value: unknown, field: string, max = 1000000): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > max) {
    throw new Error(`${field} must be a positive finite number within allowed limits`);
  }
  return n;
}

export function requireRating(value: unknown, field = "rating"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`${field} must be an integer from 1 to 5`);
  }
  return n;
}
