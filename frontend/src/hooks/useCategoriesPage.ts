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

export type CategoryAccountFlow = {
  accountId: string;
  accountName: string;
  moneyIn: number;
  moneyOut: number;
};

export type CategoryFlow = Category & {
  moneyIn: number;
  moneyOut: number;
  accounts: CategoryAccountFlow[];
};

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

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (
          transaction.transferId ||
          (transaction.type !== 'sent' && transaction.type !== 'received')
        ) {
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
        const date = transaction.transactionDate.slice(0, 10);
        if (dateRange.from && date < dateRange.from) {
          return false;
        }
        if (dateRange.to && date > dateRange.to) {
          return false;
        }
        return true;
      }),
    [transactions, selectedAccount, selectedCategory, dateRange],
  );

  const categoryFlows = useMemo(() => {
    const accountNames = new Map(
      accounts.map((account) => [account.id, account.name]),
    );
    const totals = new Map<string, Map<string, CategoryAccountFlow>>();

    filteredTransactions.forEach((transaction) => {
      let accountTotals = totals.get(transaction.categoryId);
      if (!accountTotals) {
        accountTotals = new Map();
        totals.set(transaction.categoryId, accountTotals);
      }

      let accountFlow = accountTotals.get(transaction.accountId);
      if (!accountFlow) {
        accountFlow = {
          accountId: transaction.accountId,
          accountName:
            accountNames.get(transaction.accountId) ?? 'Unknown Account',
          moneyIn: 0,
          moneyOut: 0,
        };
        accountTotals.set(transaction.accountId, accountFlow);
      }

      if (transaction.type === 'received') {
        accountFlow.moneyIn += transaction.amount;
      } else {
        accountFlow.moneyOut += transaction.amount;
      }
    });

    return categories
      .map((category): CategoryFlow => {
        const accountFlows = Array.from(
          totals.get(category.id)?.values() ?? [],
        ).sort(
          (first, second) =>
            second.moneyIn + second.moneyOut - first.moneyIn - first.moneyOut,
        );
        return {
          ...category,
          moneyIn: accountFlows.reduce(
            (total, account) => total + account.moneyIn,
            0,
          ),
          moneyOut: accountFlows.reduce(
            (total, account) => total + account.moneyOut,
            0,
          ),
          accounts: accountFlows,
        };
      })
      .filter((category) => category.moneyIn > 0 || category.moneyOut > 0)
      .sort(
        (first, second) =>
          second.moneyIn + second.moneyOut - first.moneyIn - first.moneyOut,
      );
  }, [filteredTransactions, categories, accounts]);

  const totalMoneyIn = useMemo(
    () =>
      categoryFlows.reduce((total, category) => total + category.moneyIn, 0),
    [categoryFlows],
  );
  const totalMoneyOut = useMemo(
    () =>
      categoryFlows.reduce((total, category) => total + category.moneyOut, 0),
    [categoryFlows],
  );

  return {
    accounts,
    categories,
    categoryFlows,
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
    totalMoneyIn,
    totalMoneyOut,
  };
}
