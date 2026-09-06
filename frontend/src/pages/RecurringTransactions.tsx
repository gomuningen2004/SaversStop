import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';

import type {
  Account,
  Category,
  RecurringFrequency,
  RecurringTransaction,
} from '../types';

import accountsData from '../../public/data/accounts.json';
import categoriesData from '../../public/data/categories.json';
import recurringData from '../../public/data/recurringTransactions.json';

const accounts = accountsData.accounts as Account[];
const categories = categoriesData.categories as Category[];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

const getCategoryName = (categoryId: number) =>
  categories.find((category) => category.id === categoryId)?.name ?? 'Unknown';

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getNextMonthlyDate = (dayOfMonth: number, fromDate: Date): Date => {
  const currentYear = fromDate.getFullYear();
  const currentMonth = fromDate.getMonth();

  const daysInCurrentMonth = new Date(
    currentYear,
    currentMonth + 1,
    0,
  ).getDate();

  let day = Math.min(dayOfMonth, daysInCurrentMonth);

  let candidate = new Date(currentYear, currentMonth, day);

  if (candidate < startOfDay(fromDate)) {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);

    const daysInNextMonth = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();

    day = Math.min(dayOfMonth, daysInNextMonth);

    candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
  }

  return candidate;
};

const getNextOccurrence = (
  transaction: RecurringTransaction,
  fromDate = new Date(),
): Date | null => {
  const startDate = startOfDay(new Date(`${transaction.startDate}T00:00:00`));

  const referenceDate = fromDate < startDate ? startDate : fromDate;

  if (
    transaction.endDate &&
    referenceDate > startOfDay(new Date(`${transaction.endDate}T00:00:00`))
  ) {
    return null;
  }

  if (transaction.frequency === 'monthly') {
    if (!transaction.dayOfMonth) {
      return null;
    }

    return getNextMonthlyDate(transaction.dayOfMonth, referenceDate);
  }

  if (transaction.frequency === 'yearly') {
    const start = new Date(`${transaction.startDate}T00:00:00`);

    let candidate = new Date(
      referenceDate.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );

    if (candidate < startOfDay(referenceDate)) {
      candidate = new Date(
        referenceDate.getFullYear() + 1,
        start.getMonth(),
        start.getDate(),
      );
    }

    return candidate;
  }

  if (transaction.frequency === 'weekly') {
    const targetDay = transaction.dayOfWeek ?? startDate.getDay();

    const currentDay = referenceDate.getDay();

    let difference = targetDay - currentDay;

    if (difference < 0) {
      difference += 7;
    }

    const candidate = addDays(referenceDate, difference);

    return candidate;
  }

  if (transaction.frequency === 'daily') {
    return startOfDay(referenceDate);
  }

  return null;
};

const formatFrequency = (frequency: RecurringFrequency) => {
  switch (frequency) {
    case 'daily':
      return 'Every day';

    case 'weekly':
      return 'Every week';

    case 'monthly':
      return 'Every month';

    case 'yearly':
      return 'Every year';

    default:
      return frequency;
  }
};

const getDaysUntil = (date: Date) => {
  const today = startOfDay(new Date());
  const target = startOfDay(date);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const getUpcomingLabel = (date: Date) => {
  const days = getDaysUntil(date);

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return 'Tomorrow';
  }

  if (days < 0) {
    return 'Overdue';
  }

  return `In ${days} days`;
};

function RecurringTransactions() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>(
    recurringData.recurringTransactions as RecurringTransaction[],
  );

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [showInactive, setShowInactive] = useState(false);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'sent' as 'sent' | 'received',
    frequency: 'monthly' as RecurringFrequency,
    dayOfMonth: '1',
    account: accounts[0]?.name ?? '',
    categoryId: String(categories[0]?.id ?? ''),
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      type: 'sent',
      frequency: 'monthly',
      dayOfMonth: '1',
      account: accounts[0]?.name ?? '',
      categoryId: String(categories[0]?.id ?? ''),
      startDate: new Date().toISOString().substring(0, 10),
      endDate: '',
    });

    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (transaction: RecurringTransaction) => {
    setEditingId(transaction.id);

    setForm({
      name: transaction.name,
      amount: String(transaction.amount),
      type: transaction.type,
      frequency: transaction.frequency,
      dayOfMonth: String(transaction.dayOfMonth ?? 1),
      account: transaction.account,
      categoryId: String(transaction.categoryId),
      startDate: transaction.startDate,
      endDate: transaction.endDate ?? '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.name.trim() ||
      !amount ||
      amount <= 0 ||
      !form.account ||
      !form.categoryId ||
      !form.startDate
    ) {
      return;
    }

    if (
      form.frequency === 'monthly' &&
      (!form.dayOfMonth ||
        Number(form.dayOfMonth) < 1 ||
        Number(form.dayOfMonth) > 31)
    ) {
      return;
    }

    if (editingId !== null) {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === editingId
            ? {
                ...transaction,
                name: form.name.trim(),
                amount,
                type: form.type,
                frequency: form.frequency,
                dayOfMonth:
                  form.frequency === 'monthly'
                    ? Number(form.dayOfMonth)
                    : undefined,
                account: form.account,
                categoryId: Number(form.categoryId),
                startDate: form.startDate,
                endDate: form.endDate || undefined,
              }
            : transaction,
        ),
      );
    } else {
      const nextId =
        transactions.length > 0
          ? Math.max(...transactions.map((transaction) => transaction.id)) + 1
          : 1;

      const newTransaction: RecurringTransaction = {
        id: nextId,
        name: form.name.trim(),
        amount,
        type: form.type,
        frequency: form.frequency,
        dayOfMonth:
          form.frequency === 'monthly' ? Number(form.dayOfMonth) : undefined,
        account: form.account,
        categoryId: Number(form.categoryId),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        active: true,
      };

      setTransactions((current) => [...current, newTransaction]);
    }

    closeModal();
  };

  const toggleActive = (id: number) => {
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              active: !transaction.active,
            }
          : transaction,
      ),
    );
  };

  const deleteTransaction = (id: number) => {
    const confirmed = window.confirm('Delete this recurring transaction?');

    if (!confirmed) {
      return;
    }

    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== id),
    );
  };

  const visibleTransactions = transactions.filter(
    (transaction) => showInactive || transaction.active,
  );

  const upcomingTransactions = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);

    return transactions
      .filter((transaction) => transaction.active)
      .map((transaction) => ({
        transaction,
        nextOccurrence: getNextOccurrence(transaction, today),
      }))
      .filter(
        (item) =>
          item.nextOccurrence !== null &&
          item.nextOccurrence >= today &&
          item.nextOccurrence <= weekEnd,
      )
      .sort(
        (a, b) => a.nextOccurrence!.getTime() - b.nextOccurrence!.getTime(),
      );
  }, [transactions]);

  const upcomingExpenses = upcomingTransactions
    .filter((item) => item.transaction.type === 'sent')
    .reduce((total, item) => total + item.transaction.amount, 0);

  const upcomingIncome = upcomingTransactions
    .filter((item) => item.transaction.type === 'received')
    .reduce((total, item) => total + item.transaction.amount, 0);

  useEffect(() => {
    document.title = 'Recurring Transactions | SaversStop';
  }, []);

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarClock size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Recurring Transactions
                </h1>

                <p className="text-sm text-slate-500">
                  Manage the payments and income that happen regularly.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Add Recurring
          </button>
        </div>

        {/* Upcoming */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Upcoming this week
              </h2>

              <p className="text-sm text-slate-500">
                What SaversStop expects to happen in the next 7 days.
              </p>
            </div>
          </div>

          {upcomingTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <CheckCircle2
                size={28}
                className="mx-auto mb-3 text-emerald-500"
              />

              <p className="font-medium text-slate-800">
                Nothing scheduled this week
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your upcoming recurring transactions will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Upcoming payments</p>

                  <p className="mt-2 text-xl font-semibold text-red-600">
                    {formatCurrency(upcomingExpenses)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Upcoming income</p>

                  <p className="mt-2 text-xl font-semibold text-emerald-600">
                    {formatCurrency(upcomingIncome)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Scheduled events</p>

                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {upcomingTransactions.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {upcomingTransactions.map(({ transaction, nextOccurrence }) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="w-14 text-center">
                        <p className="text-xs font-medium uppercase text-slate-400">
                          {nextOccurrence!.toLocaleDateString('en-IN', {
                            weekday: 'short',
                          })}
                        </p>

                        <p className="text-lg font-semibold text-slate-900">
                          {nextOccurrence!.getDate()}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {transaction.name}
                        </p>

                        <p className="truncate text-sm text-slate-500">
                          {transaction.account} ·{' '}
                          {getCategoryName(transaction.categoryId)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === 'received'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'received' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {getUpcomingLabel(nextOccurrence!)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Recurring list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                All recurring transactions
              </h2>

              <p className="text-sm text-slate-500">
                {
                  transactions.filter((transaction) => transaction.active)
                    .length
                }{' '}
                active recurring transactions
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInactive((current) => !current)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {showInactive ? 'Hide inactive' : 'Show inactive'}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-[2fr_1fr_1.2fr_1.3fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <div>Name</div>
              <div>Amount</div>
              <div>Schedule</div>
              <div>Account</div>
              <div>Next</div>
              <div></div>
            </div>

            {visibleTransactions.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarClock
                  size={30}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="font-medium text-slate-800">
                  No recurring transactions
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first recurring payment or income.
                </p>
              </div>
            ) : (
              visibleTransactions.map((transaction) => {
                const nextOccurrence = transaction.active
                  ? getNextOccurrence(transaction)
                  : null;

                return (
                  <div
                    key={transaction.id}
                    className={`grid gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 md:grid-cols-[2fr_1fr_1.2fr_1.3fr_1fr_auto] md:items-center ${
                      !transaction.active ? 'opacity-50' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {transaction.name}
                        </p>

                        {!transaction.active && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {getCategoryName(transaction.categoryId)}
                      </p>
                    </div>

                    <div
                      className={`font-semibold ${
                        transaction.type === 'received'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'received' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {formatFrequency(transaction.frequency)}
                      </p>

                      {transaction.frequency === 'monthly' &&
                        transaction.dayOfMonth && (
                          <p className="text-xs text-slate-500">
                            On the {transaction.dayOfMonth}
                            {transaction.dayOfMonth === 1
                              ? 'st'
                              : transaction.dayOfMonth === 2
                                ? 'nd'
                                : transaction.dayOfMonth === 3
                                  ? 'rd'
                                  : 'th'}{' '}
                            of the month
                          </p>
                        )}
                    </div>

                    <div>
                      <p className="text-sm text-slate-800">
                        {transaction.account}
                      </p>

                      <p className="text-xs text-slate-500">
                        Starts{' '}
                        {formatDate(
                          new Date(`${transaction.startDate}T00:00:00`),
                        )}
                      </p>
                    </div>

                    <div>
                      {nextOccurrence ? (
                        <>
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(nextOccurrence)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {getUpcomingLabel(nextOccurrence)}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(transaction)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActive(transaction.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title={transaction.active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId !== null
                    ? 'Edit Recurring Transaction'
                    : 'Add Recurring Transaction'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tell SaversStop what happens regularly.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Netflix"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        amount: event.target.value,
                      })
                    }
                    placeholder="649"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value as 'sent' | 'received',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="sent">Payment</option>

                    <option value="received">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Frequency
                  </label>

                  <select
                    value={form.frequency}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        frequency: event.target.value as RecurringFrequency,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="daily">Every day</option>

                    <option value="weekly">Every week</option>

                    <option value="monthly">Every month</option>

                    <option value="yearly">Every year</option>
                  </select>
                </div>

                {form.frequency === 'monthly' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Day of month
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={form.dayOfMonth}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          dayOfMonth: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Account
                </label>

                <select
                  value={form.account}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      account: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                >
                  {accounts
                    .filter((account) => account.active)
                    .map((account) => (
                      <option key={account.id} value={account.name}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      categoryId: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Start date
                  </label>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    End date
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      optional
                    </span>
                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {editingId !== null ? 'Save Changes' : 'Add Recurring'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default RecurringTransactions;
