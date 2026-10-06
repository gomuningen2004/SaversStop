import { useEffect, useState } from 'react';

import type { Account } from '../types';

const API_URL = 'http://127.0.0.1:8000';

type ApiAccount = {
  id: string;
  name: string;
  account_type_id: string;
  current_balance: number | string;
  active: boolean;
};

type AccountsResponse = {
  accounts: ApiAccount[];
};

export function useDashboardData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load account data');
        }

        return response.json() as Promise<AccountsResponse>;
      })
      .then((data) => {
        const normalizedAccounts: Account[] = data.accounts.map((account) => ({
          id: account.id,
          name: account.name,
          accountTypeId: account.account_type_id,
          currentBalance: Number(account.current_balance),
          active: account.active,
        }));

        setAccounts(normalizedAccounts.filter((account) => account.active));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load account data.');
        setLoading(false);
      });
  }, []);

  const totalFunds = accounts.reduce(
    (total, account) => total + account.currentBalance,
    0,
  );
  const sortedAccounts = [...accounts].sort(
    (a, b) => b.currentBalance - a.currentBalance,
  );

  return { sortedAccounts, totalFunds, loading, error };
}
