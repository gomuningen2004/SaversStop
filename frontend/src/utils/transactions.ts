import type { Transaction } from '../types';

export type DateFilter =
  | 'this-month'
  | 'this-year'
  | 'previous-year'
  | 'all-time'
  | 'custom';

export type DateRange = { start: string; end: string };

export type Transfer = {
  id: string;
  sent: Transaction;
  received: Transaction;
};

/* ---------- Formatting ---------- */

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount: number) =>
  currencyFormatter.format(amount);

export const formatCategory = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1);

/** "2025-06-11T..." -> "2025-06-11" (avoids timezone shifts). */
export const getDateKey = (date: string) => date.slice(0, 10);

export function formatDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---------- Date ranges ---------- */

/** Local-time YYYY-MM-DD. */
function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDateRange(
  filter: DateFilter,
  customStart: string,
  customEnd: string,
): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const today = toDateString(now);

  switch (filter) {
    case 'this-month':
      return {
        start: toDateString(new Date(year, now.getMonth(), 1)),
        end: today,
      };
    case 'this-year':
      return { start: `${year}-01-01`, end: today };
    case 'previous-year':
      return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
    case 'custom':
      return { start: customStart, end: customEnd };
    case 'all-time':
    default:
      return { start: '', end: '' };
  }
}

/* ---------- Grouping / pagination ---------- */

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getDateKey(getDate(item));
    (groups[key] ??= []).push(item);
    return groups;
  }, {});
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    totalPages,
    page: safePage,
  };
}

/** Pair up sent/received legs of each self transfer, newest first. */
export function buildTransfers(transactions: Transaction[]): Transfer[] {
  const byId = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (!t.transferId) continue;
    byId.set(t.transferId, [...(byId.get(t.transferId) ?? []), t]);
  }

  const transfers: Transfer[] = [];

  byId.forEach((legs, id) => {
    const sent = legs.find((t) => t.type === 'sent');
    const received = legs.find((t) => t.type === 'received');
    if (sent && received) transfers.push({ id, sent, received });
  });

  return transfers.sort((a, b) =>
    b.sent.transactionDate.localeCompare(a.sent.transactionDate),
  );
}
