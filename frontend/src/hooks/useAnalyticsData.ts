import { useEffect, useMemo, useState } from 'react';

import type {
  CategorySpending,
} from '../components/analytics/CategorySpendingChart';
import type { MonthlyData } from '../components/analytics/MonthlyIncomeExpenses';
import type {
  Category,
  CategoriesResponse,
  Transaction,
} from '../types';

const API_URL = 'http://127.0.0.1:8000';
const EXCLUDED_CATEGORIES = new Set(['unknown', 'other']);
const MAX_DONUT_SLICES = 7;
const REMAINING_COLOR = '#cbd5e1';

const chartColors = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

type ApiTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};

const getMonthKey = (date: string) => date.slice(0, 7);

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function getRecentMonths(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${date.getFullYear()}-${month}`;
  });
}

export function useAnalyticsData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_URL}/api/transactions`),
          fetch(`${API_URL}/api/categories`),
        ]);

        if (!transactionsResponse.ok) {
          throw new Error(
            `Transactions request failed: ${transactionsResponse.status}`,
          );
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            `Categories request failed: ${categoriesResponse.status}`,
          );
        }

        const transactionsData = (await transactionsResponse.json()) as {
          transactions: ApiTransaction[];
        };
        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        setTransactions(
          transactionsData.transactions.map((transaction) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason ?? null,
            categoryId: transaction.category_id ?? '',
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          })),
        );

        setCategories(
          categoriesData.categories.map((category) => ({
            id: category.id,
            name: category.name,
            active: category.active,
          })),
        );
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const financialTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.transferId === null),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      financialTransactions
        .filter((transaction) => transaction.type === 'received')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [financialTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      financialTransactions
        .filter((transaction) => transaction.type === 'sent')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [financialTransactions],
  );

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome === 0 ? 0 : (netSavings / totalIncome) * 100;

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const spending = new Map<string, number>();

    financialTransactions
      .filter((transaction) => transaction.type === 'sent')
      .forEach((transaction) => {
        const current = spending.get(transaction.categoryId) ?? 0;
        spending.set(transaction.categoryId, current + transaction.amount);
      });

    const visible = Array.from(spending.entries())
      .map(([categoryId, amount]) => ({
        id: categoryId,
        name: categoryMap.get(categoryId) ?? 'Unknown',
        amount,
      }))
      .filter(({ name }) => !EXCLUDED_CATEGORIES.has(name.toLowerCase()))
      .sort((a, b) => b.amount - a.amount);

    const total = visible.reduce((sum, { amount }) => sum + amount, 0);

    return visible.map((category, index) => ({
      ...category,
      percentage: total > 0 ? (category.amount / total) * 100 : 0,
      color:
        index < MAX_DONUT_SLICES
          ? chartColors[index % chartColors.length]
          : REMAINING_COLOR,
    }));
  }, [financialTransactions, categoryMap]);

  const donutData = useMemo<CategorySpending[]>(() => {
    const top = categorySpending.slice(0, MAX_DONUT_SLICES);
    const rest = categorySpending.slice(MAX_DONUT_SLICES);

    if (rest.length === 0) {
      return top;
    }

    return [
      ...top,
      {
        id: 'misc',
        name: 'Misc',
        amount: rest.reduce((sum, { amount }) => sum + amount, 0),
        percentage: rest.reduce((sum, { percentage }) => sum + percentage, 0),
        color: REMAINING_COLOR,
      },
    ];
  }, [categorySpending]);

  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = getRecentMonths(12);
    const monthly = new Map(
      months.map((month) => [month, { income: 0, expenses: 0 }]),
    );

    financialTransactions.forEach((transaction) => {
      const entry = monthly.get(getMonthKey(transaction.transactionDate));

      if (!entry) {
        return;
      }

      if (transaction.type === 'received') {
        entry.income += transaction.amount;
      } else {
        entry.expenses += transaction.amount;
      }
    });

    return months.map((month) => ({
      month,
      label: formatMonth(month),
      ...monthly.get(month)!,
    }));
  }, [financialTransactions]);

  return {
    loading,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    categorySpending,
    donutData,
    monthlyData,
  };
}
