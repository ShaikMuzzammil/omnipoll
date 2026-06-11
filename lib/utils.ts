import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generates a random alphanumeric ID (no ambiguous chars) */
export function genId(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join('');
  }
  // Fallback for Node.js environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomBytes } = require('crypto');
  const buf = randomBytes(length);
  return Array.from(buf as Buffer, (b: number) => chars[b % chars.length]).join('');
}

/** Generates a 6-char uppercase poll join code */
export function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join('');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomBytes } = require('crypto');
  const buf = randomBytes(6);
  return Array.from(buf as Buffer, (b: number) => chars[b % chars.length]).join('');
}

/** Format a timestamp as relative time */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
