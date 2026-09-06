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
} from '../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const accountTypeLabels: Record<AccountType, string> = {
  bank: 'Bank Account',
  cash: 'Cash',
  wallet: 'Wallet',
  fixed_deposit: 'Fixed Deposit',
  investment: 'Investment',
  credit_card: 'Credit Card',
  loan: 'Loan',
};

const accountTypeIcons: Record<AccountType, typeof Landmark> = {
  bank: Landmark,
  cash: Banknote,
  wallet: Wallet,
  fixed_deposit: Landmark,
  investment: Banknote,
  credit_card: CreditCard,
  loan: Banknote,
};

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [classification, setClassification] =
    useState<AccountClassification>('asset');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    fetch('/data/accounts.json')
      .then((response) => response.json() as Promise<AccountsResponse>)
      .then((data) => {
        setAccounts(data.accounts);
      })
      .catch((error) => {
        console.error('Failed to load accounts:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.active),
    [accounts],
  );

  const assetAccounts = useMemo(
    () =>
      activeAccounts.filter((account) => account.classification === 'asset'),
    [activeAccounts],
  );

  const liabilityAccounts = useMemo(
    () =>
      activeAccounts.filter(
        (account) => account.classification === 'liability',
      ),
    [activeAccounts],
  );

  const totalAssets = useMemo(
    () => assetAccounts.reduce((total, account) => total + account.balance, 0),
    [assetAccounts],
  );

  const totalLiabilities = useMemo(
    () =>
      liabilityAccounts.reduce(
        (total, account) => total + Math.abs(account.balance),
        0,
      ),
    [liabilityAccounts],
  );

  const netWorth = totalAssets - totalLiabilities;

  const resetForm = () => {
    setName('');
    setType('bank');
    setClassification('asset');
    setBalance('');
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setClassification(account.classification);
    setBalance(account.balance.toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);

    /*
     * Credit cards and loans are liabilities by default.
     * Everything else is an asset.
     */
    if (newType === 'credit_card' || newType === 'loan') {
      setClassification('liability');
    } else {
      setClassification('asset');
    }
  };

  const handleSave = () => {
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

    /*
     * Liability balances are stored as positive numbers.
     * The application treats them as amounts owed.
     */
    const normalizedBalance = Math.abs(numericBalance);

    if (editingAccount) {
      setAccounts((current) =>
        current.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                name: trimmedName,
                type,
                classification,
                balance: normalizedBalance,
              }
            : account,
        ),
      );
    } else {
      const newAccount: Account = {
        id:
          accounts.length > 0
            ? Math.max(...accounts.map((account) => account.id)) + 1
            : 1,
        name: trimmedName,
        type,
        classification,
        balance: normalizedBalance,
        active: true,
      };

      setAccounts((current) => [...current, newAccount]);
    }

    closeModal();
  };

  const handleDelete = (account: Account) => {
    const confirmed = window.confirm(`Deactivate "${account.name}"?`);

    if (!confirmed) return;

    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id ? { ...item, active: false } : item,
      ),
    );
  };

  const renderAccount = (account: Account) => {
    const Icon = accountTypeIcons[account.type];

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
                {accountTypeLabels[account.type]}
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
            {account.classification === 'asset'
              ? 'Current Value'
              : 'Outstanding'}
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${
              account.classification === 'liability'
                ? 'text-red-600'
                : 'text-slate-900'
            }`}
          >
            {formatCurrency(Math.abs(account.balance))}
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

              {/* TYPE */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Account Type
                </span>

                <select
                  value={type}
                  onChange={(event) =>
                    handleTypeChange(event.target.value as AccountType)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="bank">Bank Account</option>

                  <option value="cash">Cash</option>

                  <option value="wallet">Wallet</option>

                  <option value="fixed_deposit">Fixed Deposit</option>

                  <option value="investment">Investment</option>

                  <option value="credit_card">Credit Card</option>

                  <option value="loan">Loan</option>
                </select>
              </label>

              {/* CLASSIFICATION */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Classification
                </span>

                <select
                  value={classification}
                  onChange={(event) =>
                    setClassification(
                      event.target.value as AccountClassification,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
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
