import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { Account, Category } from '../types';

const API_URL = 'http://127.0.0.1:8000';

type FormMode = 'transaction' | 'self-transfer';
type TransactionType = 'sent' | 'received';

function AddTransaction() {
  const navigate = useNavigate();

  /*
   * ---------------------------------------------------------
   * DATA
   * ---------------------------------------------------------
   */

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /*
   * ---------------------------------------------------------
   * FORM MODE
   * ---------------------------------------------------------
   */

  const [mode, setMode] = useState<FormMode>('transaction');

  /*
   * ---------------------------------------------------------
   * COMMON FIELDS
   * ---------------------------------------------------------
   */

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [amount, setAmount] = useState('');

  /*
   * ---------------------------------------------------------
   * NORMAL TRANSACTION FIELDS
   * ---------------------------------------------------------
   */

  const [transactionType, setTransactionType] =
    useState<TransactionType>('sent');

  const [reason, setReason] = useState('');

  const [categoryId, setCategoryId] = useState('');

  const [accountId, setAccountId] = useState('');

  /*
   * ---------------------------------------------------------
   * SELF TRANSFER FIELDS
   * ---------------------------------------------------------
   */

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD ACCOUNTS + CATEGORIES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadFormData() {
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

        /*
         * -----------------------------------------------------
         * ACCOUNTS
         * -----------------------------------------------------
         */

        const accountsData = (await accountsResponse.json()) as {
          accounts: Array<{
            id: string;
            name: string;
            account_type_id: string;
            current_balance: number | string;
            active: boolean;
          }>;
        };

        const normalizedAccounts: Account[] = accountsData.accounts.map(
          (account) => ({
            id: account.id,
            name: account.name,
            accountTypeId: account.account_type_id,
            currentBalance: Number(account.current_balance),
            active: account.active,
          }),
        );

        const activeAccounts = normalizedAccounts.filter(
          (account) => account.active,
        );

        /*
         * -----------------------------------------------------
         * CATEGORIES
         * -----------------------------------------------------
         */

        const categoriesData = (await categoriesResponse.json()) as {
          categories: Array<{
            id: string;
            name: string;
            active: boolean;
          }>;
        };

        const activeCategories: Category[] = categoriesData.categories.filter(
          (category) => category.active,
        );

        setAccounts(activeAccounts);
        setCategories(activeCategories);

        /*
         * -----------------------------------------------------
         * DEFAULT ACCOUNT
         * -----------------------------------------------------
         */

        if (activeAccounts.length > 0) {
          setAccountId(activeAccounts[0].id);
          setFromAccountId(activeAccounts[0].id);

          if (activeAccounts.length > 1) {
            setToAccountId(activeAccounts[1].id);
          }
        }

        /*
         * -----------------------------------------------------
         * DEFAULT CATEGORY
         * -----------------------------------------------------
         */

        if (activeCategories.length > 0) {
          const otherCategory = activeCategories.find(
            (category) => category.name.toLowerCase() === 'other',
          );

          setCategoryId(otherCategory?.id ?? activeCategories[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load accounts and categories.',
        );

        setLoading(false);
      }
    }

    loadFormData();
  }, []);

  /*
   * ---------------------------------------------------------
   * FORMAT CATEGORY NAME
   * ---------------------------------------------------------
   */

  function formatCategoryName(name: string) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /*
   * ---------------------------------------------------------
   * API ERROR
   * ---------------------------------------------------------
   */

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
      // Use fallback message.
    }

    return fallbackMessage;
  }

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');

    /*
     * -------------------------------------------------------
     * COMMON VALIDATION
     * -------------------------------------------------------
     */

    if (!date) {
      setError('Please select a date.');
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    /*
     * -------------------------------------------------------
     * NORMAL TRANSACTION VALIDATION
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * SELF TRANSFER VALIDATION
     * -------------------------------------------------------
     */

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
      /*
       * =====================================================
       * NORMAL TRANSACTION
       * =====================================================
       */

      if (mode === 'transaction') {
        /*
         * FastAPI expects:
         *
         * {
         *   transaction_date,
         *   reason,
         *   category_id,
         *   account_id,
         *   amount,
         *   type
         * }
         *
         * The backend generates the transaction ID.
         */

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
          const message = await getApiError(
            response,
            'Failed to add transaction.',
          );

          throw new Error(message);
        }

        /*
         * Backend successfully created the transaction
         * and updated the account balance.
         */

        navigate('/transactions');

        return;
      }

      /*
       * =====================================================
       * SELF TRANSFER
       * =====================================================
       *
       * Only ONE API request is needed.
       *
       * The backend creates:
       *
       * 1. Transfer record
       * 2. Sent transaction
       * 3. Received transaction
       * 4. Source account balance update
       * 5. Destination account balance update
       */

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
        const message = await getApiError(
          response,
          'Failed to add self transfer.',
        );

        throw new Error(message);
      }

      /*
       * Backend successfully created the transfer
       * and updated both account balances.
       */

      navigate('/transactions');
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

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD ERROR
   * ---------------------------------------------------------
   */

  if (error && !accounts.length && !categories.length) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>

        <Link
          to="/transactions"
          className="mt-4 inline-block text-sm font-medium text-slate-700 underline"
        >
          Back to Transactions
        </Link>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 pb-24 lg:pb-8">
      {/* PAGE HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Add Transaction
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add income, expenses, or move money between your accounts.
        </p>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        {/* =================================================
            MODE SELECTOR
        ================================================= */}

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-700">
            What would you like to add?
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
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

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            NORMAL TRANSACTION
        ================================================= */}

        {mode === 'transaction' ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2">
            {/* DATE */}

            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>

              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>

            {/* TRANSACTION TYPE */}

            <div>
              <label
                htmlFor="transactionType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Transaction Type
              </label>

              <select
                id="transactionType"
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value as TransactionType)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              >
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>

            {/* REASON */}

            <div className="lg:col-span-2">
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Reason
              </label>

              <input
                id="reason"
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Amazon purchase"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category
              </label>

              <select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatCategoryName(category.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* ACCOUNT */}

            <div>
              <label
                htmlFor="account"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Account
              </label>

              <select
                id="account"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                <option value="">Select account</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AMOUNT */}

            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Amount
              </label>

              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
          </div>
        ) : (
          /* =================================================
             SELF TRANSFER
          ================================================= */

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2">
            {/* DATE */}

            <div className="lg:col-span-2">
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>

              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>

            {/* FROM ACCOUNT */}

            <div>
              <label
                htmlFor="fromAccount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                From Account
              </label>

              <select
                id="fromAccount"
                value={fromAccountId}
                onChange={(event) => setFromAccountId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                <option value="">Select account</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TO ACCOUNT */}

            <div>
              <label
                htmlFor="toAccount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                To Account
              </label>

              <select
                id="toAccount"
                value={toAccountId}
                onChange={(event) => setToAccountId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                <option value="">Select account</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AMOUNT */}

            <div>
              <label
                htmlFor="transferAmount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Amount
              </label>

              <input
                id="transferAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
          </div>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            to="/transactions"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : mode === 'transaction'
                ? 'Add Transaction'
                : 'Add Transfer'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default AddTransaction;
