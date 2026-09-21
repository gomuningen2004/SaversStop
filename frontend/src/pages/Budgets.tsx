import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Settings,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Budget, Category, Transaction } from '../types';

import {
  analyzeBudgets,
  formatBudgetMonth,
  getBudgetTotals,
  getCurrentMonth,
} from '../utils/budgets';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (amount: number) => currency.format(amount);

function Budgets() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [showModal, setShowModal] = useState(false);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [categoryId, setCategoryId] = useState('');

  const [amount, setAmount] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetsResponse, categoriesResponse, transactionsResponse] =
          await Promise.all([
            fetch('/data/budgets.json'),
            fetch('/data/categories.json'),
            fetch('/data/transactions.json'),
          ]);

        if (
          !budgetsResponse.ok ||
          !categoriesResponse.ok ||
          !transactionsResponse.ok
        ) {
          throw new Error('Failed to load budget data');
        }

        const [budgetsData, categoriesData, transactionsData] =
          await Promise.all([
            budgetsResponse.json(),
            categoriesResponse.json(),
            transactionsResponse.json(),
          ]);

        /*
         * -----------------------------------------------------
         * NORMALIZE BUDGETS
         *
         * JSON:
         *   category_id
         *
         * Frontend:
         *   categoryId
         * -----------------------------------------------------
         */

        const normalizedBudgets: Budget[] = (budgetsData.budgets ?? []).map(
          (budget: {
            id: string;
            month: string;
            category_id: string;
            amount: number;
          }) => ({
            id: budget.id,
            month: budget.month,
            categoryId: budget.category_id,
            amount: Number(budget.amount),
          }),
        );

        /*
         * -----------------------------------------------------
         * NORMALIZE CATEGORIES
         * -----------------------------------------------------
         */

        const normalizedCategories: Category[] = (
          categoriesData.categories ?? []
        ).map((category: { id: string; name: string; active: boolean }) => ({
          id: category.id,
          name: category.name,
          active: category.active,
        }));

        /*
         * -----------------------------------------------------
         * NORMALIZE TRANSACTIONS
         *
         * JSON uses snake_case.
         * Frontend types use camelCase.
         * -----------------------------------------------------
         */

        const normalizedTransactions: Transaction[] = (
          transactionsData.transactions ?? []
        ).map(
          (transaction: {
            id: string;
            transaction_date: string;
            reason?: string | null;
            category_id: string;
            account_id: string;
            amount: number;
            type: 'sent' | 'received';
            transfer_id?: string | null;
          }) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason,
            categoryId: transaction.category_id,
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          }),
        );

        setBudgets(normalizedBudgets);
        setCategories(normalizedCategories);
        setTransactions(normalizedTransactions);
      } catch (error) {
        console.error('Failed to load budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * BUDGET ANALYSIS
   * ---------------------------------------------------------
   */

  const analyses = useMemo(
    () =>
      analyzeBudgets(budgets, categories, transactions, selectedMonth).sort(
        (a, b) => b.spent - a.spent,
      ),
    [budgets, categories, transactions, selectedMonth],
  );

  const totals = useMemo(() => getBudgetTotals(analyses), [analyses]);

  /*
   * ---------------------------------------------------------
   * AVAILABLE CATEGORIES
   * ---------------------------------------------------------
   *
   * A category can only have one budget per month.
   *
   * The old code excluded category ID 5 because IDs were
   * numeric. IDs are now UUIDs, so we exclude the "salary"
   * category by name instead.
   * ---------------------------------------------------------
   */

  const availableCategories = useMemo(() => {
    const usedCategoryIds = budgets
      .filter((budget) => budget.month === selectedMonth)
      .filter(
        (budget) => editingBudget === null || budget.id !== editingBudget.id,
      )
      .map((budget) => budget.categoryId);

    return categories.filter(
      (category) =>
        category.active &&
        category.name.toLowerCase() !== 'salary' &&
        !usedCategoryIds.includes(category.id),
    );
  }, [budgets, categories, selectedMonth, editingBudget]);

  /*
   * ---------------------------------------------------------
   * ALERT GROUPS
   * ---------------------------------------------------------
   */

  const criticalBudgets = analyses.filter(
    (item) => item.status === 'critical' || item.status === 'exceeded',
  );

  const warningBudgets = analyses.filter((item) => item.status === 'warning');

  /*
   * ---------------------------------------------------------
   * MONTH NAVIGATION
   * ---------------------------------------------------------
   */

  const changeMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-');

    const date = new Date(Number(year), Number(month) - 1 + direction, 1);

    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    );
  };

  /*
   * ---------------------------------------------------------
   * MODAL
   * ---------------------------------------------------------
   */

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setAmount(budget.amount.toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
  };

  /*
   * ---------------------------------------------------------
   * SAVE BUDGET
   * ---------------------------------------------------------
   */

  const saveBudget = () => {
    const parsedAmount = Number(amount);

    if (!categoryId) {
      alert('Please select a category.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    /*
     * Prevent duplicate category budgets in the same month.
     */

    const duplicate = budgets.some(
      (budget) =>
        budget.month === selectedMonth &&
        budget.categoryId === categoryId &&
        budget.id !== editingBudget?.id,
    );

    if (duplicate) {
      alert('A budget already exists for this category in this month.');
      return;
    }

    /*
     * -------------------------------------------------------
     * EDIT EXISTING BUDGET
     * -------------------------------------------------------
     */

    if (editingBudget) {
      setBudgets((currentBudgets) =>
        currentBudgets.map((budget) =>
          budget.id === editingBudget.id
            ? {
                ...budget,
                month: selectedMonth,
                categoryId,
                amount: parsedAmount,
              }
            : budget,
        ),
      );

      closeModal();
      return;
    }

    /*
     * -------------------------------------------------------
     * ADD NEW BUDGET
     * -------------------------------------------------------
     */

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      month: selectedMonth,
      categoryId,
      amount: parsedAmount,
    };

    setBudgets((currentBudgets) => [...currentBudgets, newBudget]);

    closeModal();
  };

  /*
   * ---------------------------------------------------------
   * DELETE BUDGET
   * ---------------------------------------------------------
   */

  const deleteBudget = (budget: Budget) => {
    const category = categories.find((item) => item.id === budget.categoryId);

    const confirmed = window.confirm(
      `Delete the ${
        category?.name ?? ''
      } budget for ${formatBudgetMonth(budget.month)}?`,
    );

    if (!confirmed) {
      return;
    }

    setBudgets((currentBudgets) =>
      currentBudgets.filter((item) => item.id !== budget.id),
    );
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-500">Loading budgets...</p>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-[calc(100vh-64px)] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Budgets</h1>

            <p className="mt-1 text-sm text-slate-500">
              Decide how much you can spend before the month begins.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/categories/manage')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Settings size={17} />
              Manage Categories
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Add Budget
            </button>
          </div>
        </div>

        {/* Month selector */}

        <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-base font-semibold text-slate-900">
              {formatBudgetMonth(selectedMonth)}
            </p>

            <button
              onClick={() => setSelectedMonth(getCurrentMonth())}
              className="mt-0.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Go to current month
            </button>
          </div>

          <button
            onClick={() => changeMonth(1)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Budget</p>

            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatAmount(totals.totalBudget)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Spent</p>

            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatAmount(totals.totalSpent)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {totals.percentageUsed.toFixed(1)}% of budget used
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Remaining</p>

            <p
              className={`mt-2 text-2xl font-semibold ${
                totals.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatAmount(Math.abs(totals.totalRemaining))}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {totals.totalRemaining >= 0
                ? 'Available to spend'
                : 'Over total budget'}
            </p>
          </div>
        </div>

        {/* Alerts */}

        {criticalBudgets.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <XCircle size={21} className="mt-0.5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Budget needs attention
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {criticalBudgets.length === 1
                    ? `${
                        criticalBudgets[0].category?.name ?? 'A category'
                      } is at or above its budget.`
                    : `${criticalBudgets.length} categories are at or above their budgets.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {warningBudgets.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle
                size={21}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="font-semibold text-amber-800">Budget warning</p>

                <p className="mt-1 text-sm text-amber-700">
                  {warningBudgets.length === 1
                    ? `${
                        warningBudgets[0].category?.name ?? 'A category'
                      } is almost at its budget.`
                    : `${warningBudgets.length} categories are using 75% or more of their budgets.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}

        {analyses.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Target size={40} className="mx-auto text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No budgets for this month
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create category budgets to see how much you've spent and how much
              you have left.
            </p>

            <button
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus size={17} />
              Add Budget
            </button>
          </div>
        )}

        {/* Budget table */}

        {analyses.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="hidden border-b border-slate-100 px-6 py-4 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_auto] md:gap-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Category
              </p>

              <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Budget
              </p>

              <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Spent
              </p>

              <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Remaining
              </p>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Progress
              </p>

              <div />
            </div>

            <div className="divide-y divide-slate-100">
              {analyses.map(
                ({
                  budget,
                  category,
                  spent,
                  remaining,
                  percentageUsed,
                  status,
                }) => {
                  const progressWidth = Math.min(percentageUsed, 100);

                  const progressClass =
                    status === 'exceeded'
                      ? 'bg-red-500'
                      : status === 'critical'
                        ? 'bg-orange-500'
                        : status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500';

                  return (
                    <div
                      key={budget.id}
                      className="p-5 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_auto] md:items-center md:gap-4 md:px-6"
                    >
                      {/* Category */}

                      <div className="flex items-center justify-between md:block">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                            <Target size={17} className="text-slate-600" />
                          </div>

                          <div>
                            <p className="font-medium capitalize text-slate-900">
                              {category?.name ?? 'Unknown'}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500 md:hidden">
                              {percentageUsed.toFixed(1)}% used
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget */}

                      <div className="mt-4 flex items-center justify-between md:mt-0 md:block md:text-right">
                        <span className="text-xs text-slate-500 md:hidden">
                          Budget
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {formatAmount(budget.amount)}
                        </span>
                      </div>

                      {/* Spent */}

                      <div className="mt-2 flex items-center justify-between md:mt-0 md:block md:text-right">
                        <span className="text-xs text-slate-500 md:hidden">
                          Spent
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {formatAmount(spent)}
                        </span>
                      </div>

                      {/* Remaining */}

                      <div className="mt-2 flex items-center justify-between md:mt-0 md:block md:text-right">
                        <span className="text-xs text-slate-500 md:hidden">
                          Remaining
                        </span>

                        <span
                          className={`text-sm font-semibold ${
                            remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {remaining >= 0
                            ? formatAmount(remaining)
                            : `-${formatAmount(Math.abs(remaining))}`}
                        </span>
                      </div>

                      {/* Progress */}

                      <div className="mt-4 md:mt-0">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs text-slate-500 md:hidden">
                            Usage
                          </span>

                          <span className="text-xs font-medium text-slate-600">
                            {percentageUsed.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${progressClass}`}
                            style={{
                              width: `${progressWidth}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1.5 text-xs text-slate-500">
                          {status === 'exceeded'
                            ? `Over by ${formatAmount(Math.abs(remaining))}`
                            : status === 'critical'
                              ? 'Almost exhausted'
                              : status === 'warning'
                                ? 'Getting close'
                                : 'Within budget'}
                        </p>
                      </div>

                      {/* Actions */}

                      <div className="mt-4 flex justify-end gap-1 md:mt-0">
                        <button
                          onClick={() => openEditModal(budget)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit budget"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => deleteBudget(budget)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete budget"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* Status legend */}

        {analyses.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Under 75%
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              75–89%
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              90–99%
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              100%+
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}

      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingBudget ? 'Edit Budget' : 'Add Budget'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set your spending limit for {formatBudgetMonth(selectedMonth)}
                  .
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Select category</option>

                {/*
                 * When editing, the existing category is normally
                 * excluded from availableCategories. Add it back
                 * so it remains selectable.
                 */}

                {editingBudget &&
                  !availableCategories.some(
                    (category) => category.id === editingBudget.categoryId,
                  ) && (
                    <option value={editingBudget.categoryId}>
                      {categories.find(
                        (category) => category.id === editingBudget.categoryId,
                      )?.name ?? 'Current category'}
                    </option>
                  )}

                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name.charAt(0).toUpperCase() +
                      category.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Monthly budget
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="8000"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pl-8 text-sm outline-none focus:border-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                How it works
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                SaversStop will automatically compare this budget with your
                actual transactions for the selected month.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={saveBudget}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                {editingBudget ? 'Save Changes' : 'Add Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Budgets;
