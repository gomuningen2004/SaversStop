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
  X,
} from 'lucide-react';

import type {
  Account,
  AccountClassification,
  AccountType,
  AccountsResponse,
  AccountTypesResponse,
} from '../types';

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

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [classification, setClassification] =
    useState<AccountClassification>('asset');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/accounts`).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load accounts');
        }

        return response.json() as Promise<AccountsResponse>;
      }),

      fetch(`${API_URL}/api/account-types`).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load account types');
        }

        return response.json() as Promise<AccountTypesResponse>;
      }),
    ])
      .then(([accountsData, accountTypesData]) => {
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

        if (normalizedAccountTypes.length > 0) {
          setTypeId(normalizedAccountTypes[0].id);
          setClassification(normalizedAccountTypes[0].classification);
        }
      })
      .catch((error) => {
        console.error('Failed to load account data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeAccountTypes = useMemo(
    () => accountTypes.filter((accountType) => accountType.active),
    [accountTypes],
  );

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

  const resetForm = () => {
    setName('');

    if (activeAccountTypes.length > 0) {
      const defaultType = activeAccountTypes[0];

      setTypeId(defaultType.id);
      setClassification(defaultType.classification);
    } else {
      setTypeId('');
      setClassification('asset');
    }

    setBalance('');
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    const accountType = getAccountType(account.accountTypeId);

    setEditingAccount(account);
    setName(account.name);
    setTypeId(account.accountTypeId);
    setClassification(accountType?.classification ?? 'asset');
    setBalance(account.currentBalance.toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleTypeChange = (newTypeId: string) => {
    setTypeId(newTypeId);

    const selectedType = getAccountType(newTypeId);

    if (selectedType) {
      setClassification(selectedType.classification);
    }
  };

  const handleClassificationChange = (
    newClassification: AccountClassification,
  ) => {
    setClassification(newClassification);

    const compatibleType = activeAccountTypes.find(
      (accountType) => accountType.classification === newClassification,
    );

    if (compatibleType) {
      setTypeId(compatibleType.id);
    }
  };

  const normalizeAccount = (account: {
    id: string;
    name: string;
    account_type_id: string;
    current_balance: string | number;
    active: boolean;
  }): Account => ({
    id: account.id,
    name: account.name,
    accountTypeId: account.account_type_id,
    currentBalance: Number(account.current_balance),
    active: account.active,
  });

  const handleSave = async () => {
    const trimmedName = name.trim();
    const numericBalance = Number(balance);

    if (!trimmedName) {
      alert('Please enter an account name.');
      return;
    }

    if (balance === '' || Number.isNaN(numericBalance)) {
      alert('Please enter a valid balance.');
      return;
    }

    if (!typeId) {
      alert('Please select an account type.');
      return;
    }

    const selectedType = getAccountType(typeId);

    if (!selectedType) {
      alert('Please select a valid account type.');
      return;
    }

    const normalizedBalance = Math.abs(numericBalance);

    try {
      if (editingAccount) {
        const response = await fetch(
          `${API_URL}/api/accounts/${editingAccount.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: trimmedName,
              account_type_id: typeId,
              current_balance: normalizedBalance,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(errorData?.detail || 'Failed to update account');
        }

        const data = await response.json();

        const updatedAccount = normalizeAccount(data.account);

        setAccounts((current) =>
          current.map((account) =>
            account.id === updatedAccount.id ? updatedAccount : account,
          ),
        );
      } else {
        const response = await fetch(`${API_URL}/api/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            account_type_id: typeId,
            current_balance: normalizedBalance,
            active: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(errorData?.detail || 'Failed to create account');
        }

        const data = await response.json();

        const newAccount = normalizeAccount(data.account);

        setAccounts((current) => [...current, newAccount]);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to save account:', error);

      alert(error instanceof Error ? error.message : 'Failed to save account.');
    }
  };

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

      const deactivatedAccount = normalizeAccount(data.account);

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
                  onClick={() => openEditModal(account)}
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
            onClick={openAddModal}
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

      {/* ADD / EDIT ACCOUNT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingAccount ? 'Edit Account' : 'Add Account'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add an account to your financial picture.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4">
              {/* NAME */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Account Name
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>

              {/* CLASSIFICATION */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Classification
                </span>

                <select
                  value={classification}
                  onChange={(event) =>
                    handleClassificationChange(
                      event.target.value as AccountClassification,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                </select>
              </label>

              {/* TYPE */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Account Type
                </span>

                <select
                  value={typeId}
                  onChange={(event) => handleTypeChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {activeAccountTypes
                    .filter(
                      (accountType) =>
                        accountType.classification === classification,
                    )
                    .map((accountType) => (
                      <option key={accountType.id} value={accountType.id}>
                        {accountType.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* BALANCE */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Current Balance
                </span>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                {editingAccount ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Accounts;
