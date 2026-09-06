import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type {
  Account,
  AccountsResponse,
  Category,
  CategoriesResponse,
} from '../types';

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

  const [account, setAccount] = useState('');

  /*
   * ---------------------------------------------------------
   * SELF TRANSFER FIELDS
   * ---------------------------------------------------------
   */

  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD ACCOUNTS + CATEGORIES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    Promise.all([fetch('/data/accounts.json'), fetch('/data/categories.json')])
      .then(async ([accountsResponse, categoriesResponse]) => {
        if (!accountsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load form data');
        }

        const accountsData =
          (await accountsResponse.json()) as AccountsResponse;

        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        setAccounts(accountsData.accounts);
        setCategories(categoriesData.categories);

        /*
         * Set sensible defaults.
         */

        if (accountsData.accounts.length > 0) {
          setAccount(accountsData.accounts[0].name);
          setFromAccount(accountsData.accounts[0].name);

          if (accountsData.accounts.length > 1) {
            setToAccount(accountsData.accounts[1].name);
          }
        }

        if (categoriesData.categories.length > 0) {
          setCategoryId(String(categoriesData.categories[0].id));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load accounts and categories.');
        setLoading(false);
      });
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
   * SUBMIT
   * ---------------------------------------------------------
   */

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!date) {
      alert('Please select a date.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    /*
     * -------------------------------------------------------
     * NORMAL TRANSACTION
     * -------------------------------------------------------
     */

    if (mode === 'transaction') {
      if (!reason.trim()) {
        alert('Please enter a reason.');
        return;
      }

      if (!categoryId) {
        alert('Please select a category.');
        return;
      }

      if (!account) {
        alert('Please select an account.');
        return;
      }

      const transaction = {
        id: Date.now(),
        date,
        reason: reason.trim(),
        categoryId: Number(categoryId),
        account,
        amount: numericAmount,
        type: transactionType,
      };

      console.log('New transaction:', transaction);

      alert('Transaction added successfully.');

      navigate('/transactions');

      return;
    }

    /*
     * -------------------------------------------------------
     * SELF TRANSFER
     * -------------------------------------------------------
     */

    if (!fromAccount || !toAccount) {
      alert('Please select both accounts.');
      return;
    }

    if (fromAccount === toAccount) {
      alert('From Account and To Account must be different.');
      return;
    }

    /*
     * Find the "other" category.
     */

    const otherCategory = categories.find(
      (category) => category.name.toLowerCase() === 'other',
    );

    if (!otherCategory) {
      alert('The "other" category is required for self transfers.');
      return;
    }

    /*
     * Both records share the same transferId.
     */

    const transferId = Date.now();

    const sentTransaction = {
      id: transferId,
      date,
      categoryId: otherCategory.id,
      account: fromAccount,
      amount: numericAmount,
      type: 'sent' as const,
      transferId,
    };

    const receivedTransaction = {
      id: transferId + 1,
      date,
      categoryId: otherCategory.id,
      account: toAccount,
      amount: numericAmount,
      type: 'received' as const,
      transferId,
    };

    console.log('Self transfer:', {
      sent: sentTransaction,
      received: receivedTransaction,
    });

    alert('Self transfer added successfully.');

    navigate('/transactions');
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
   * ERROR
   * ---------------------------------------------------------
   */

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
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
              onClick={() => setMode('transaction')}
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
              onClick={() => setMode('self-transfer')}
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
            FORM FIELDS
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
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                {accounts.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
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
                value={fromAccount}
                onChange={(event) => setFromAccount(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                {accounts.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
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
                value={toAccount}
                onChange={(event) => setToAccount(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                required
              >
                {accounts.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
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
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {mode === 'transaction' ? 'Add Transaction' : 'Add Transfer'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default AddTransaction;
