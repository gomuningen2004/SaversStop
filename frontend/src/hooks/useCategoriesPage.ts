import { useEffect, useMemo, useState } from 'react';

import type {
  Account,
  CategoriesResponse,
  Category,
  Transaction,
} from '../types';
import type { CategoryPeriod } from '../components/categories/CategoryFilters';

type RawTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};

type RawTransactionsResponse = { transactions: RawTransaction[] };
type RawAccount = {
  id: string;
  name: string;
  account_type_id: string;
  current_balance: number | string;
  active: boolean;
};
type AccountsResponse = { accounts: RawAccount[] };

const API_URL = 'http://127.0.0.1:8000';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCategoryName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export function useCategoriesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<CategoryPeriod>('this-month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/transactions`),
      fetch(`${API_URL}/api/accounts`),
      fetch(`${API_URL}/api/categories`),
    ])
      .then(
        async ([
          transactionsResponse,
          accountsResponse,
          categoriesResponse,
        ]) => {
          if (
            !transactionsResponse.ok ||
            !accountsResponse.ok ||
            !categoriesResponse.ok
          ) {
            throw new Error('Failed to load data');
          }

          const transactionsData =
            (await transactionsResponse.json()) as RawTransactionsResponse;
          const accountsData =
            (await accountsResponse.json()) as AccountsResponse;
          const categoriesData =
            (await categoriesResponse.json()) as CategoriesResponse;

          const normalizedTransactions: Transaction[] =
            transactionsData.transactions.map((transaction) => ({
              id: transaction.id,
              transactionDate: transaction.transaction_date,
              reason: transaction.reason,
              categoryId: transaction.category_id ?? '',
              accountId: transaction.account_id,
              amount: Number(transaction.amount),
              type: transaction.type,
              transferId: transaction.transfer_id ?? null,
            }));
          const normalizedAccounts: Account[] = accountsData.accounts.map(
            (account) => ({
              id: account.id,
              name: account.name,
              accountTypeId: account.account_type_id,
              currentBalance: Number(account.current_balance),
              active: account.active,
            }),
          );

          setTransactions(normalizedTransactions);
          setAccounts(normalizedAccounts);
          setCategories(categoriesData.categories);
          setLoading(false);
        },
      )
      .catch((err: unknown) => {
        console.error(err);
        setError('Unable to load category data.');
        setLoading(false);
      });
  }, []);

  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === 'all-time') return { from: '', to: '' };
    if (period === 'custom') return { from: customFrom, to: customTo };
    if (period === 'today') {
      const date = getDateString(today);
      return { from: date, to: date };
    }
    if (period === 'this-week') {
      const day = today.getDay();
      const difference = day === 0 ? 6 : day - 1;
      const from = new Date(today);
      from.setDate(today.getDate() - difference);
      return { from: getDateString(from), to: getDateString(today) };
    }
    if (period === 'this-month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: getDateString(from), to: getDateString(today) };
    }
    if (period === 'last-month') {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: getDateString(from), to: getDateString(to) };
    }
    if (period === 'this-year') {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: getDateString(from), to: getDateString(today) };
    }
    if (period === 'last-year') {
      const from = new Date(today.getFullYear() - 1, 0, 1);
      const to = new Date(today.getFullYear() - 1, 11, 31);
      return { from: getDateString(from), to: getDateString(to) };
    }
    return { from: '', to: '' };
  }, [period, customFrom, customTo]);

  const spendingTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (transaction.type !== 'sent' || transaction.transferId !== null) {
          return false;
        }
        if (
          selectedAccount !== 'all' &&
          transaction.accountId !== selectedAccount
        ) {
          return false;
        }
        if (
          selectedCategory !== 'all' &&
          transaction.categoryId !== selectedCategory
        ) {
          return false;
        }
        if (dateRange.from && transaction.transactionDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && transaction.transactionDate > dateRange.to) {
          return false;
        }
        return true;
      }),
    [transactions, selectedAccount, selectedCategory, dateRange],
  );
  const categorySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    spendingTransactions.forEach((transaction) => {
      totals[transaction.categoryId] =
        (totals[transaction.categoryId] ?? 0) + transaction.amount;
    });
    return categories
      .map((category) => ({
        ...category,
        amount: totals[category.id] ?? 0,
      }))
      .filter((category) => category.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [spendingTransactions, categories]);
  const totalSpent = useMemo(
    () =>
      spendingTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0,
      ),
    [spendingTransactions],
  );

  return {
    accounts,
    categories,
    categorySpending,
    customFrom,
    customTo,
    error,
    formatCategoryName,
    formatCurrency,
    loading,
    period,
    selectedAccount,
    selectedCategory,
    setCustomFrom,
    setCustomTo,
    setPeriod,
    setSelectedAccount,
    setSelectedCategory,
    totalSpent,
  };
}
