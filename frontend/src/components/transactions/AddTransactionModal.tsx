import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

import type { Account, Category } from '../../types';

const API_URL = 'http://127.0.0.1:8000';

type FormMode = 'transaction' | 'self-transfer';
type TransactionType = 'sent' | 'received';

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  date: string;
  amount: string;
  type: TransactionType;
  reason: string;
  categoryId: string;
  accountId: string;
  fromAccountId: string;
  toAccountId: string;
};

/* Shape returned by the backend (snake_case). */
type ApiAccount = {
  id: string;
  name: string;
  account_type_id: string;
  current_balance: number | string;
  active: boolean;
};

const MODES: { value: FormMode; label: string; submitLabel: string }[] = [
  {
    value: 'transaction',
    label: 'Transaction',
    submitLabel: 'Add Transaction',
  },
  {
    value: 'self-transfer',
    label: 'Self Transfer',
    submitLabel: 'Add Transfer',
  },
];

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

/* en-CA formats as YYYY-MM-DD in the *local* timezone (toISOString uses UTC). */
const todayString = () => new Date().toLocaleDateString('en-CA');

const createEmptyForm = (): FormState => ({
  date: todayString(),
  amount: '',
  type: 'sent',
  reason: '',
  categoryId: '',
  accountId: '',
  fromAccountId: '',
  toAccountId: '',
});

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

async function getApiError(response: Response, fallback: string) {
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
    // Fall through to the default message.
  }

  return fallback;
}

async function postJson(path: string, body: unknown, fallbackError: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, fallbackError));
  }
}

/* Small presentational helpers used only by this modal. */

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function AccountSelect({
  value,
  accounts,
  onChange,
}: {
  value: string;
  accounts: Account[];
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
      required
    >
      <option value="">Select account</option>

      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<FormMode>('transaction');
  const [form, setForm] = useState<FormState>(createEmptyForm);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  /* Load accounts + categories each time the modal opens. */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadFormData = async () => {
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
          accounts: ApiAccount[];
        };
        const categoriesData = (await categoriesResponse.json()) as {
          categories: Category[];
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

        const activeCategories = categoriesData.categories.filter(
          (category) => category.active,
        );

        setAccounts(activeAccounts);
        setCategories(activeCategories);

        /* Sensible defaults: first two accounts, "Other" category. */
        const [firstAccount, secondAccount] = activeAccounts;
        const defaultCategory =
          activeCategories.find(
            (category) => category.name.toLowerCase() === 'other',
          ) ?? activeCategories[0];

        setForm((previous) => ({
          ...previous,
          accountId: firstAccount?.id ?? '',
          fromAccountId: firstAccount?.id ?? '',
          toAccountId: secondAccount?.id ?? '',
          categoryId: defaultCategory?.id ?? '',
        }));
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
    };

    loadFormData();
  }, [isOpen]);

  const resetForm = () => {
    setMode('transaction');
    setForm(createEmptyForm());
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

  const handleModeChange = (nextMode: FormMode) => {
    setMode(nextMode);
    setError('');
  };

  /* Returns an error message, or null when the form is valid. */
  const validate = (): string | null => {
    if (!form.date) {
      return 'Please select a date.';
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Please enter a valid amount.';
    }

    if (mode === 'transaction') {
      if (!form.reason.trim()) return 'Please enter a reason.';
      if (!form.categoryId) return 'Please select a category.';
      if (!form.accountId) return 'Please select an account.';
    } else {
      if (!form.fromAccountId || !form.toAccountId) {
        return 'Please select both accounts.';
      }

      if (form.fromAccountId === form.toAccountId) {
        return 'From Account and To Account must be different.';
      }
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);

    const amount = Number(form.amount);
    const timestamp = `${form.date}T00:00:00`;

    try {
      if (mode === 'transaction') {
        await postJson(
          '/api/transactions',
          {
            transaction_date: timestamp,
            reason: form.reason.trim(),
            category_id: form.categoryId,
            account_id: form.accountId,
            amount,
            type: form.type,
          },
          'Failed to add transaction.',
        );
      } else {
        await postJson(
          '/api/transfers',
          {
            transfer_date: timestamp,
            source_account_id: form.fromAccountId,
            destination_account_id: form.toAccountId,
            amount,
            reason: null,
          },
          'Failed to add self transfer.',
        );
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
  };

  if (!isOpen) {
    return null;
  }

  const isTransfer = mode === 'self-transfer';
  const submitLabel = MODES.find((m) => m.value === mode)!.submitLabel;

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
                <p className={labelClass}>What would you like to add?</p>

                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  {MODES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleModeChange(option.value)}
                      className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${
                        mode === option.value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* FIELDS */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Date"
                  className={isTransfer ? 'sm:col-span-2' : undefined}
                >
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setField('date', event.target.value)}
                    className={inputClass}
                    required
                  />
                </Field>

                {isTransfer ? (
                  <>
                    <Field label="From Account">
                      <AccountSelect
                        value={form.fromAccountId}
                        accounts={accounts}
                        onChange={(id) => setField('fromAccountId', id)}
                      />
                    </Field>

                    <Field label="To Account">
                      <AccountSelect
                        value={form.toAccountId}
                        accounts={accounts}
                        onChange={(id) => setField('toAccountId', id)}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Transaction Type">
                      <select
                        value={form.type}
                        onChange={(event) =>
                          setField(
                            'type',
                            event.target.value as TransactionType,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                      </select>
                    </Field>

                    <Field label="Reason" className="sm:col-span-2">
                      <input
                        type="text"
                        value={form.reason}
                        onChange={(event) =>
                          setField('reason', event.target.value)
                        }
                        placeholder="e.g. Amazon purchase"
                        className={inputClass}
                        required
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        value={form.categoryId}
                        onChange={(event) =>
                          setField('categoryId', event.target.value)
                        }
                        className={inputClass}
                        required
                      >
                        <option value="">Select category</option>

                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {capitalize(category.name)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Account">
                      <AccountSelect
                        value={form.accountId}
                        accounts={accounts}
                        onChange={(id) => setField('accountId', id)}
                      />
                    </Field>
                  </>
                )}

                <Field label="Amount">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setField('amount', event.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                    required
                  />
                </Field>
              </div>
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
                {submitting ? 'Saving...' : submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddTransactionModal;
