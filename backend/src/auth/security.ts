import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';

export type Security = {
  hashPassword(password: string): Promise<string>;
  verifyPassword(hash: string, password: string): Promise<boolean>;
  token(): string;
  hashToken(token: string): string;
};

export const security: Security = {
  hashPassword: (password) => argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
  verifyPassword: (hash, password) => argon2.verify(hash, password),
  token: () => randomBytes(32).toString('base64url'),
  hashToken: (token) => createHash('sha256').update(token).digest('hex'),
};

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
