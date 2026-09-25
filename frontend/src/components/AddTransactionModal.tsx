import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type { Account, Category } from '../types';

const API_URL = 'http://127.0.0.1:8000';

type FormMode = 'transaction' | 'self-transfer';
type TransactionType = 'sent' | 'received';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

const labelClassName = 'mb-2 block text-sm font-medium text-slate-700';

function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<FormMode>('transaction');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [amount, setAmount] = useState('');

  const [transactionType, setTransactionType] =
    useState<TransactionType>('sent');

  const [reason, setReason] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadFormData() {
      setLoading(true);
      setError('');

      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_URL}/api/accounts`),
          fetch(`${API_URL}/api/categories`),
        ]);

        if (!accountsResponse.ok) {
          throw new Error('Failed to load accounts.');
        }

        if (!categoriesResponse.ok) {
          throw new Error('Failed to load categories.');
        }

        const accountsData = (await accountsResponse.json()) as {
          accounts: Array<{
            id: string;
            name: string;
            account_type_id: string;
            current_balance: number | string;
            active: boolean;
          }>;
        };

        const categoriesData = (await categoriesResponse.json()) as {
          categories: Array<{
            id: string;
            name: string;
            active: boolean;
          }>;
        };

        const activeAccounts: Account[] = accountsData.accounts
          .filter((account) => account.active)
          .map((account) => ({
            id: account.id,
            name: account.name,
            accountTypeId: account.account_type_id,
            currentBalance: Number(account.current_balance),
            active: account.active,
          }));

        const activeCategories: Category[] = categoriesData.categories.filter(
          (category) => category.active,
        );

        setAccounts(activeAccounts);
        setCategories(activeCategories);

        if (activeAccounts.length > 0) {
          setAccountId(activeAccounts[0].id);
          setFromAccountId(activeAccounts[0].id);

          if (activeAccounts.length > 1) {
            setToAccountId(activeAccounts[1].id);
          } else {
            setToAccountId('');
          }
        } else {
          setAccountId('');
          setFromAccountId('');
          setToAccountId('');
        }

        if (activeCategories.length > 0) {
          const otherCategory = activeCategories.find(
            (category) => category.name.toLowerCase() === 'other',
          );

          setCategoryId(otherCategory?.id ?? activeCategories[0].id);
        } else {
          setCategoryId('');
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load accounts and categories.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadFormData();
  }, [isOpen]);

  const resetForm = () => {
    setMode('transaction');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setTransactionType('sent');
    setReason('');
    setCategoryId('');
    setAccountId('');
    setFromAccountId('');
    setToAccountId('');
    setError('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };

  function formatCategoryName(name: string) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  async function getApiError(response: Response, fallbackMessage: string) {
    try {
      const data = await response.json();

      if (typeof data.detail === 'string') {
        return data.detail;
      }

      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item: { msg?: string }) => item.msg)
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      // Use fallback.
    }

    return fallbackMessage;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');

    if (!date) {
      setError('Please select a date.');
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (mode === 'transaction') {
      if (!reason.trim()) {
        setError('Please enter a reason.');
        return;
      }

      if (!categoryId) {
        setError('Please select a category.');
        return;
      }

      if (!accountId) {
        setError('Please select an account.');
        return;
      }
    }

    if (mode === 'self-transfer') {
      if (!fromAccountId || !toAccountId) {
        setError('Please select both accounts.');
        return;
      }

      if (fromAccountId === toAccountId) {
        setError('From Account and To Account must be different.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'transaction') {
        const response = await fetch(`${API_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_date: `${date}T00:00:00`,
            reason: reason.trim(),
            category_id: categoryId,
            account_id: accountId,
            amount: numericAmount,
            type: transactionType,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiError(response, 'Failed to add transaction.'),
          );
        }
      } else {
        const response = await fetch(`${API_URL}/api/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transfer_date: `${date}T00:00:00`,
            source_account_id: fromAccountId,
            destination_account_id: toAccountId,
            amount: numericAmount,
            reason: null,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiError(response, 'Failed to add self transfer.'),
          );
        }
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );

      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Transaction
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add income, expenses, or move money between your accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 px-6 py-6">
              {/* MODE */}

              <div>
                <label className={labelClassName}>
                  What would you like to add?
                </label>

                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('transaction');
                      setError('');
                    }}
                    className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${
                      mode === 'transaction'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Transaction
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('self-transfer');
                      setError('');
                    }}
                    className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${
                      mode === 'self-transfer'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Self Transfer
                  </button>
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {mode === 'transaction' ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* DATE */}

                  <label>
                    <span className={labelClassName}>Date</span>

                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={inputClassName}
                      required
                    />
                  </label>

                  {/* TYPE */}

                  <label>
                    <span className={labelClassName}>Transaction Type</span>

                    <select
                      value={transactionType}
                      onChange={(event) =>
                        setTransactionType(
                          event.target.value as TransactionType,
                        )
                      }
                      className={inputClassName}
                    >
                      <option value="sent">Sent</option>
                      <option value="received">Received</option>
                    </select>
                  </label>

                  {/* REASON */}

                  <label className="sm:col-span-2">
                    <span className={labelClassName}>Reason</span>

                    <input
                      type="text"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="e.g. Amazon purchase"
                      className={inputClassName}
                      required
                    />
                  </label>

                  {/* CATEGORY */}

                  <label>
                    <span className={labelClassName}>Category</span>

                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className={inputClassName}
                      required
                    >
                      <option value="">Select category</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {formatCategoryName(category.name)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* ACCOUNT */}

                  <label>
                    <span className={labelClassName}>Account</span>

                    <select
                      value={accountId}
                      onChange={(event) => setAccountId(event.target.value)}
                      className={inputClassName}
                      required
                    >
                      <option value="">Select account</option>

                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* AMOUNT */}

                  <label>
                    <span className={labelClassName}>Amount</span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      className={inputClassName}
                      required
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* DATE */}

                  <label className="sm:col-span-2">
                    <span className={labelClassName}>Date</span>

                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={inputClassName}
                      required
                    />
                  </label>

                  {/* FROM */}

                  <label>
                    <span className={labelClassName}>From Account</span>

                    <select
                      value={fromAccountId}
                      onChange={(event) => setFromAccountId(event.target.value)}
                      className={inputClassName}
                      required
                    >
                      <option value="">Select account</option>

                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* TO */}

                  <label>
                    <span className={labelClassName}>To Account</span>

                    <select
                      value={toAccountId}
                      onChange={(event) => setToAccountId(event.target.value)}
                      className={inputClassName}
                      required
                    >
                      <option value="">Select account</option>

                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* AMOUNT */}

                  <label>
                    <span className={labelClassName}>Amount</span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      className={inputClassName}
                      required
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Saving...'
                  : mode === 'transaction'
                    ? 'Add Transaction'
                    : 'Add Transfer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddTransactionModal;
