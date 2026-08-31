import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatINR(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact currency for stat cards: ₹1.2L, ₹3.4Cr, ₹8,900. */
export function formatINRCompact(amount: number): string {
  const n = Number(amount || 0);
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString('en-IN');
}

export function formatCompact(n: number): string {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1_00_000) return `${(v / 1_00_000).toFixed(1)}L`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "3 hours ago", "2 days ago" — for activity feeds / notifications. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

export function initials(name: string | null | undefined): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * % change vs a previous period, formatted with the ▲/▼ arrow the stat-card
 * badge uses. Returns null when there's no prior baseline to compare against.
 */
export function pctChange(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } | null {
  if (previous === 0) {
    if (current === 0) return { value: 0, direction: 'flat' };
    return { value: 100, direction: 'up' };
  }
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.abs(Math.round(raw * 10) / 10),
    direction: raw > 0.05 ? 'up' : raw < -0.05 ? 'down' : 'flat',
  };
}

/**
 * Runs a PostgREST query and never throws: a missing table (the mobile app's
 * migrations 0002–0025 may not be applied yet), an RLS block, or a network
 * blip all resolve to `fallback` so a dashboard tile renders "0" instead of a
 * 500. Real bugs still surface in the server log.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safe<T>(query: PromiseLike<any>, fallback: T): Promise<T> {
  try {
    const { data, error } = await query;
    if (error) {
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.warn('[admin] query error:', error.code, error.message);
      }
      return fallback;
    }
    return (data as T) ?? fallback;
  } catch (e) {
    console.warn('[admin] query threw:', (e as Error).message);
    return fallback;
  }
}

/** Same idea for `{ count }` head queries. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeCount(query: PromiseLike<any>): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) {
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.warn('[admin] count error:', error.code, error.message);
      }
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.warn('[admin] count threw:', (e as Error).message);
    return 0;
  }
}
