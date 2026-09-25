import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

import type {
  Account,
  AccountType,
  AccountsResponse,
  AccountTypesResponse,
} from '../types';

import AddAccountModal from '../components/AddAccountModal';

const API_URL = 'http://127.0.0.1:8000';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const accountTypeIcons: Record<string, typeof Landmark> = {
  Bank: Landmark,
  Cash: Banknote,
  Wallet: Wallet,
  'Fixed Deposit': Landmark,
  Investment: Banknote,
  'Credit Card': CreditCard,
  Loan: Banknote,
};

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const [accountsResponse, accountTypesResponse] = await Promise.all([
        fetch(`${API_URL}/api/accounts`),
        fetch(`${API_URL}/api/account-types`),
      ]);

      if (!accountsResponse.ok) {
        throw new Error('Failed to load accounts');
      }

      if (!accountTypesResponse.ok) {
        throw new Error('Failed to load account types');
      }

      const accountsData = (await accountsResponse.json()) as AccountsResponse;

      const accountTypesData =
        (await accountTypesResponse.json()) as AccountTypesResponse;

      const normalizedAccounts: Account[] = accountsData.accounts.map(
        (account) => ({
          id: account.id,
          name: account.name,
          accountTypeId: account.account_type_id,
          currentBalance: Number(account.current_balance),
          active: account.active,
        }),
      );

      const normalizedAccountTypes: AccountType[] =
        accountTypesData.accountTypes.map((accountType) => ({
          id: accountType.id,
          name: accountType.name,
          classification: accountType.classification,
          active: accountType.active,
        }));

      setAccounts(normalizedAccounts);
      setAccountTypes(normalizedAccountTypes);
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.active),
    [accounts],
  );

  const getAccountType = (accountTypeId: string) =>
    accountTypes.find((accountType) => accountType.id === accountTypeId);

  const getAccountClassification = (account: Account) =>
    getAccountType(account.accountTypeId)?.classification;

  const assetAccounts = useMemo(
    () =>
      activeAccounts.filter(
        (account) => getAccountClassification(account) === 'asset',
      ),
    [activeAccounts, accountTypes],
  );

  const liabilityAccounts = useMemo(
    () =>
      activeAccounts.filter(
        (account) => getAccountClassification(account) === 'liability',
      ),
    [activeAccounts, accountTypes],
  );

  const totalAssets = useMemo(
    () =>
      assetAccounts.reduce(
        (total, account) => total + account.currentBalance,
        0,
      ),
    [assetAccounts],
  );

  const totalLiabilities = useMemo(
    () =>
      liabilityAccounts.reduce(
        (total, account) => total + Math.abs(account.currentBalance),
        0,
      ),
    [liabilityAccounts],
  );

  const netWorth = totalAssets - totalLiabilities;

  const handleDelete = async (account: Account) => {
    const confirmed = window.confirm(`Deactivate "${account.name}"?`);

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.detail || 'Failed to deactivate account');
      }

      const data = await response.json();

      const deactivatedAccount: Account = {
        id: data.account.id,
        name: data.account.name,
        accountTypeId: data.account.account_type_id,
        currentBalance: Number(data.account.current_balance),
        active: data.account.active,
      };

      setAccounts((current) =>
        current.map((item) =>
          item.id === deactivatedAccount.id ? deactivatedAccount : item,
        ),
      );
    } catch (error) {
      console.error('Failed to deactivate account:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to deactivate account.',
      );
    }
  };

  const renderAccount = (account: Account) => {
    const accountType = getAccountType(account.accountTypeId);

    const accountClassification = accountType?.classification;

    const Icon = accountTypeIcons[accountType?.name ?? ''] ?? Landmark;

    return (
      <div
        key={account.id}
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Icon size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">{account.name}</h3>

              <p className="mt-1 text-xs text-slate-500">
                {accountType?.name ?? 'Unknown Account Type'}
              </p>
            </div>
          </div>

          <div className="relative">
            <details>
              <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <MoreHorizontal size={18} />
              </summary>

              <div className="absolute right-0 top-9 z-10 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Deactivate
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-slate-500">
            {accountClassification === 'asset'
              ? 'Current Value'
              : 'Outstanding'}
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${
              accountClassification === 'liability'
                ? 'text-red-600'
                : 'text-slate-900'
            }`}
          >
            {formatCurrency(Math.abs(account.currentBalance))}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading accounts...</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage where your money is and what you owe.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAccountModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        {/* NET WORTH */}

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">Net Worth</p>

          <p
            className={`mt-2 text-3xl font-semibold ${
              netWorth >= 0 ? 'text-slate-900' : 'text-red-600'
            }`}
          >
            {formatCurrency(Math.abs(netWorth))}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Total Assets</p>

              <p className="mt-1 text-lg font-semibold text-green-600">
                {formatCurrency(totalAssets)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Total Liabilities</p>

              <p className="mt-1 text-lg font-semibold text-red-600">
                {formatCurrency(totalLiabilities)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Accounts</p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {activeAccounts.length}
              </p>
            </div>
          </div>
        </div>

        {/* ASSETS */}

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assets</h2>

              <p className="mt-1 text-sm text-slate-500">
                Money and things you own.
              </p>
            </div>

            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(totalAssets)}
            </p>
          </div>

          {assetAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No asset accounts.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assetAccounts.map(renderAccount)}
            </div>
          )}
        </section>

        {/* LIABILITIES */}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Liabilities
              </h2>

              <p className="mt-1 text-sm text-slate-500">Money you owe.</p>
            </div>

            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>

          {liabilityAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No liabilities.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liabilityAccounts.map(renderAccount)}
            </div>
          )}
        </section>
      </div>

      {/* ADD ACCOUNT MODAL */}

      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={async () => {
          setShowAddAccountModal(false);
          await loadAccounts();
        }}
      />
    </main>
  );
}

export default Accounts;
