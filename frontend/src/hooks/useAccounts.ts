import { useCallback, useEffect, useState } from 'react';

import type {
  Account,
  AccountType,
  AccountsResponse,
  AccountTypesResponse,
} from '../types';

import { normalizeAccount, normalizeAccountType } from '../utils/accounts';

const API_URL = 'http://127.0.0.1:8000';

type UseAccountsResult = {
  accounts: Account[];
  accountTypes: AccountType[];
  loading: boolean;
  error: string;
  loadAccounts: () => Promise<void>;
  deactivateAccount: (account: Account) => Promise<void>;
};

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD ACCOUNTS
   * ---------------------------------------------------------
   */

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [accountsResponse, accountTypesResponse] = await Promise.all([
        fetch(`${API_URL}/api/accounts`),
        fetch(`${API_URL}/api/account-types`),
      ]);

      if (!accountsResponse.ok) {
        throw new Error(`Accounts request failed: ${accountsResponse.status}`);
      }

      if (!accountTypesResponse.ok) {
        throw new Error(
          `Account types request failed: ${accountTypesResponse.status}`,
        );
      }

      const accountsData = (await accountsResponse.json()) as AccountsResponse;

      const accountTypesData =
        (await accountTypesResponse.json()) as AccountTypesResponse;

      const normalizedAccounts = (accountsData.accounts ?? []).map(
        normalizeAccount,
      );

      const normalizedAccountTypes = (accountTypesData.accountTypes ?? []).map(
        normalizeAccountType,
      );

      setAccounts(normalizedAccounts);
      setAccountTypes(normalizedAccountTypes);
    } catch (loadError) {
      console.error('Failed to load account data:', loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load account data.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  /*
   * ---------------------------------------------------------
   * DEACTIVATE ACCOUNT
   * ---------------------------------------------------------
   */

  const deactivateAccount = useCallback(async (account: Account) => {
    const confirmed = window.confirm(`Deactivate "${account.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      const response = await fetch(`${API_URL}/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: false,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail ?? 'Failed to deactivate account.',
        );
      }

      const updatedAccount = normalizeAccount(responseData.account);

      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === updatedAccount.id
            ? updatedAccount
            : currentAccount,
        ),
      );
    } catch (deactivateError) {
      console.error('Failed to deactivate account:', deactivateError);

      const message =
        deactivateError instanceof Error
          ? deactivateError.message
          : 'Failed to deactivate account.';

      setError(message);

      window.alert(message);
    }
  }, []);

  return {
    accounts,
    accountTypes,
    loading,
    error,
    loadAccounts,
    deactivateAccount,
  };
}
