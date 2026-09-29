import { useCallback, useEffect, useState } from 'react';

import type {
  Account,
  AccountsResponse,
  Category,
  Transaction,
} from '../types';

const API_URL = 'http://127.0.0.1:8000';

type RawTransaction = {
  id: string;
  transaction_date: string;
  reason: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id: string | null;
};

type RawCategory = { id: string; name: string; active: boolean };

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

export function useTransactionData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [txData, accountData, categoryData] = await Promise.all([
        getJson<{ transactions: RawTransaction[] }>('/api/transactions'),
        getJson<AccountsResponse>('/api/accounts'),
        getJson<{ categories: RawCategory[] }>('/api/categories'),
      ]);

      setTransactions(
        txData.transactions.map((t) => ({
          id: t.id,
          transactionDate: t.transaction_date,
          reason: t.reason,
          categoryId: t.category_id ?? '',
          accountId: t.account_id,
          amount: Number(t.amount),
          type: t.type,
          transferId: t.transfer_id,
        })),
      );

      setAccounts(
        accountData.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          accountTypeId: a.account_type_id,
          currentBalance: Number(a.current_balance),
          active: a.active,
        })),
      );

      setCategories(
        categoryData.categories.map((c) => ({
          id: c.id,
          name: c.name,
          active: c.active,
        })),
      );

      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load transaction data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, categories, accounts, loading, error, reload: load };
}
