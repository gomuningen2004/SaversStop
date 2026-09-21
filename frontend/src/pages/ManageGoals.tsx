import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Goal } from '../types';

type ModalMode = 'add' | 'edit';

type RawGoal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  target_date: string;
  status: 'active' | 'completed';
};

type RawGoalsResponse = {
  goals: RawGoal[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) {
    return '-';
  }

  const [year, month, day] = date.split('-').map(Number);

  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ManageGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Goal modal
   */
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>('add');

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  /*
   * Form fields
   */
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const [goalError, setGoalError] = useState('');

  /*
   * Load goals.
   */
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const response = await fetch('/data/goals.json');

        if (!response.ok) {
          throw new Error('Failed to load goals');
        }

        const goalsData = (await response.json()) as RawGoalsResponse;

        /*
         * Convert JSON snake_case fields
         * into frontend camelCase fields.
         */
        const normalizedGoals: Goal[] = (goalsData.goals ?? []).map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetAmount: Number(goal.target_amount),
          savedAmount: Number(goal.saved_amount),
          monthlyContribution: Number(goal.monthly_contribution),
          targetDate: goal.target_date,
          status: goal.status,
        }));

        setGoals(normalizedGoals);
      } catch (err) {
        console.error(err);
        setError('Unable to load goals.');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  /*
   * Open Add Goal modal.
   */
  function openAddGoalModal() {
    setModalMode('add');
    setEditingGoalId(null);

    setGoalName('');
    setTargetAmount('');
    setMonthlyContribution('');
    setTargetDate('');

    setGoalError('');
    setShowGoalModal(true);
  }

  /*
   * Open Edit Goal modal.
   */
  function openEditGoalModal(goal: Goal) {
    setModalMode('edit');
    setEditingGoalId(goal.id);

    setGoalName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setMonthlyContribution(String(goal.monthlyContribution));
    setTargetDate(goal.targetDate);

    setGoalError('');
    setShowGoalModal(true);
  }

  /*
   * Close modal.
   */
  function closeGoalModal() {
    setShowGoalModal(false);
    setEditingGoalId(null);

    setGoalName('');
    setTargetAmount('');
    setMonthlyContribution('');
    setTargetDate('');

    setGoalError('');
  }

  /*
   * Add or edit goal.
   */
  function handleGoalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setGoalError('');

    const trimmedName = goalName.trim();

    const numericTargetAmount = Number(targetAmount);

    const numericMonthlyContribution = Number(monthlyContribution);

    if (!trimmedName) {
      setGoalError('Please enter a goal name.');
      return;
    }

    if (!Number.isFinite(numericTargetAmount) || numericTargetAmount <= 0) {
      setGoalError('Please enter a valid target amount.');
      return;
    }

    if (
      !Number.isFinite(numericMonthlyContribution) ||
      numericMonthlyContribution <= 0
    ) {
      setGoalError('Please enter a valid monthly contribution.');
      return;
    }

    if (numericMonthlyContribution > numericTargetAmount) {
      setGoalError(
        'Monthly contribution cannot be greater than the target amount.',
      );
      return;
    }

    if (!targetDate) {
      setGoalError('Please select a target date.');
      return;
    }

    /*
     * Target date must be today or in the future.
     */
    const selectedDate = new Date(`${targetDate}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setGoalError('Target date must be today or a future date.');
      return;
    }

    /*
     * ADD
     */
    if (modalMode === 'add') {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        name: trimmedName,
        targetAmount: numericTargetAmount,
        savedAmount: 0,
        monthlyContribution: numericMonthlyContribution,
        targetDate,
        status: 'active',
      };

      setGoals((current) => [...current, newGoal]);

      closeGoalModal();

      return;
    }

    /*
     * EDIT
     */
    if (editingGoalId !== null) {
      setGoals((current) =>
        current.map((goal) => {
          if (goal.id !== editingGoalId) {
            return goal;
          }

          /*
           * Keep the amount already saved.
           *
           * If the target is reduced below the
           * current saved amount, cap savedAmount
           * at the new target.
           */
          const savedAmount = Math.min(goal.savedAmount, numericTargetAmount);

          return {
            ...goal,
            name: trimmedName,
            targetAmount: numericTargetAmount,
            savedAmount,
            monthlyContribution: numericMonthlyContribution,
            targetDate,
            status: savedAmount >= numericTargetAmount ? 'completed' : 'active',
          };
        }),
      );

      closeGoalModal();
    }
  }

  /*
   * Delete goal.
   */
  function handleDeleteGoal(goal: Goal) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setGoals((current) => current.filter((item) => item.id !== goal.id));
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading goals...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                to="/goals"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Goals
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">
              Manage Goals
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add, edit, or remove your savings goals.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddGoalModal}
            className="flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus size={17} />
            Add Goal
          </button>
        </div>

        {/* ==================================================
            GOAL CARDS
        ================================================== */}

        {goals.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No goals available.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first savings goal to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {goals.map((goal) => {
              const percentage =
                goal.targetAmount > 0
                  ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                  : 0;

              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {goal.name}
                      </p>

                      {goal.status === 'completed' && (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Completed
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEditGoalModal(goal)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Edit ${goal.name}`}
                        title="Edit goal"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${goal.name}`}
                        title="Delete goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <p className="mt-5 text-lg font-semibold text-slate-900">
                    {formatCurrency(goal.targetAmount)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatCurrency(goal.savedAmount)} saved
                  </p>

                  {/* PROGRESS */}

                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {percentage.toFixed(0)}% complete
                    </p>
                  </div>

                  {/* DETAILS */}

                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                    <div className="flex justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Monthly
                      </span>

                      <span className="text-[11px] font-medium text-slate-700">
                        {formatCurrency(goal.monthlyContribution)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Target</span>

                      <span className="text-[11px] font-medium text-slate-700">
                        {formatDate(goal.targetDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================
          ADD / EDIT GOAL MODAL
      ================================================== */}

      {showGoalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={closeGoalModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalMode === 'add' ? 'Add Goal' : 'Edit Goal'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === 'add'
                    ? 'Set up a new savings goal.'
                    : 'Update your savings goal.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeGoalModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleGoalSubmit}>
              <div className="space-y-4">
                {/* NAME */}

                <div>
                  <label
                    htmlFor="goal-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Goal Name
                  </label>

                  <input
                    id="goal-name"
                    type="text"
                    value={goalName}
                    onChange={(event) => setGoalName(event.target.value)}
                    placeholder="e.g. New Laptop"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    autoFocus
                  />
                </div>

                {/* TARGET AMOUNT */}

                <div>
                  <label
                    htmlFor="target-amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Target Amount
                  </label>

                  <input
                    id="target-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    placeholder="80000"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* MONTHLY CONTRIBUTION */}

                <div>
                  <label
                    htmlFor="monthly-contribution"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Monthly Contribution
                  </label>

                  <input
                    id="monthly-contribution"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monthlyContribution}
                    onChange={(event) =>
                      setMonthlyContribution(event.target.value)
                    }
                    placeholder="10000"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    How much you plan to put aside each month.
                  </p>
                </div>

                {/* TARGET DATE */}

                <div>
                  <label
                    htmlFor="target-date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Target Completion Date
                  </label>

                  <input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* ERROR */}

              {goalError && (
                <p className="mt-4 text-sm text-red-500">{goalError}</p>
              )}

              {/* BUTTONS */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  {modalMode === 'add' ? 'Add Goal' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageGoals;
