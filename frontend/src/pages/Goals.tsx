import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

import type { Account, Goal } from '../types';

import {
  analyzeGoal,
  formatGoalDate,
  formatGoalTargetDate,
} from '../utils/goals';

const API_URL = 'http://127.0.0.1:8000';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (amount: number) => currency.format(amount);

type AnalysisStatus =
  | 'completed'
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'not_feasible';

type RawGoal = {
  id: string;
  name: string;

  account_id: string;
  account_name: string | null;

  target_amount: number | string;
  saved_amount: number | string;
  monthly_contribution: number | string;

  target_date: string;

  status: 'active' | 'completed';
};

type RawGoalsResponse = {
  goals: RawGoal[];
};

type RawAccountsResponse = {
  accounts: Array<{
    id: string;
    name: string;
    account_type_id: string;
    current_balance: number | string;
    active: boolean;
  }>;
};

type GoalResponse = RawGoal;

const statusConfig: Record<
  AnalysisStatus,
  {
    label: string;
    className: string;
  }
> = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },

  ahead: {
    label: 'Ahead of schedule',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },

  on_track: {
    label: 'On track',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },

  behind: {
    label: 'Behind schedule',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },

  not_feasible: {
    label: 'Needs attention',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

const getStatusMessage = (
  status: AnalysisStatus,
  monthsEarly: number,
  monthsLate: number,
): string => {
  switch (status) {
    case 'completed':
      return '✓ Goal completed';

    case 'ahead':
      return `✓ At your current contribution rate, you'll reach this goal ${monthsEarly} month${
        monthsEarly === 1 ? '' : 's'
      } early.`;

    case 'on_track':
      return '✓ Your planned contribution is enough to reach this goal on time.';

    case 'behind':
      return `⚠️ Your current contribution may leave you about ${monthsLate} month${
        monthsLate === 1 ? '' : 's'
      } behind the target.`;

    case 'not_feasible':
      return '⚠️ Add a monthly contribution to make this goal achievable.';

    default:
      return '';
  }
};

function normalizeGoal(goal: RawGoal): Goal {
  return {
    id: goal.id,
    name: goal.name,

    accountId: goal.account_id,
    accountName: goal.account_name,

    targetAmount: Number(goal.target_amount),
    savedAmount: Number(goal.saved_amount),
    monthlyContribution: Number(goal.monthly_contribution),

    targetDate: goal.target_date,
    status: goal.status,
  };
}

function normalizeAccount(
  account: RawAccountsResponse['accounts'][number],
): Account {
  return {
    id: account.id,
    name: account.name,
    accountTypeId: account.account_type_id,
    currentBalance: Number(account.current_balance),
    active: account.active,
  };
}

function Goals() {
  /*
   * ---------------------------------------------------------
   * GOALS / ACCOUNTS
   * ---------------------------------------------------------
   */

  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * INLINE EDITING
   * ---------------------------------------------------------
   */

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [editGoalName, setEditGoalName] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editMonthlyContribution, setEditMonthlyContribution] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  const [editError, setEditError] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  /*
   * ---------------------------------------------------------
   * INLINE ADD
   * ---------------------------------------------------------
   */

  const [showAddGoal, setShowAddGoal] = useState(false);

  const [newGoalName, setNewGoalName] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newMonthlyContribution, setNewMonthlyContribution] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const [addGoalError, setAddGoalError] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * CONTRIBUTION
   * ---------------------------------------------------------
   */

  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const [contributionAmount, setContributionAmount] = useState('');

  const [contributionSaving, setContributionSaving] = useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD GOALS + ACCOUNTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [goalsResponse, accountsResponse] = await Promise.all([
          fetch(`${API_URL}/api/goals`),
          fetch(`${API_URL}/api/accounts`),
        ]);

        if (!goalsResponse.ok) {
          throw new Error(`Goals request failed: ${goalsResponse.status}`);
        }

        if (!accountsResponse.ok) {
          throw new Error(
            `Accounts request failed: ${accountsResponse.status}`,
          );
        }

        const goalsData = (await goalsResponse.json()) as RawGoalsResponse;

        const accountsData =
          (await accountsResponse.json()) as RawAccountsResponse;

        const normalizedGoals = (goalsData.goals ?? []).map(normalizeGoal);

        const normalizedAccounts = (accountsData.accounts ?? [])
          .filter((account) => account.active)
          .map(normalizeAccount);

        setGoals(normalizedGoals);
        setAccounts(normalizedAccounts);
      } catch (loadError) {
        console.error('Failed to load goals/accounts:', loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load goals.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * ANALYZE EVERY GOAL
   * ---------------------------------------------------------
   */

  const analyses = useMemo(() => {
    return goals.map((goal) => ({
      goal,
      analysis: analyzeGoal(
        goal.targetAmount,
        goal.savedAmount,
        goal.monthlyContribution,
        goal.targetDate,
      ),
    }));
  }, [goals]);

  /*
   * ---------------------------------------------------------
   * TOTAL TARGET
   * ---------------------------------------------------------
   */

  const totalTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * TOTAL SAVED
   * ---------------------------------------------------------
   */

  const totalSaved = useMemo(
    () => goals.reduce((total, goal) => total + goal.savedAmount, 0),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * ACTIVE GOALS
   * ---------------------------------------------------------
   */

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'active'),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * COMPLETED GOALS
   * ---------------------------------------------------------
   */

  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'completed'),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * ADD GOAL
   * ---------------------------------------------------------
   */

  const openAddGoal = () => {
    setShowAddGoal(true);

    setNewGoalName('');
    setNewAccountId(accounts[0]?.id ?? '');
    setNewTargetAmount('');
    setNewMonthlyContribution('');
    setNewTargetDate('');

    setAddGoalError('');
  };

  const closeAddGoal = () => {
    if (addingGoal) {
      return;
    }

    setShowAddGoal(false);

    setNewGoalName('');
    setNewAccountId('');
    setNewTargetAmount('');
    setNewMonthlyContribution('');
    setNewTargetDate('');

    setAddGoalError('');
  };

  const addGoal = async () => {
    setAddGoalError('');

    const trimmedName = newGoalName.trim();

    const numericTargetAmount = Number(newTargetAmount);

    const numericMonthlyContribution = Number(newMonthlyContribution);

    if (!trimmedName) {
      setAddGoalError('Please enter a goal name.');
      return;
    }

    if (!newAccountId) {
      setAddGoalError('Please select an account.');
      return;
    }

    if (!Number.isFinite(numericTargetAmount) || numericTargetAmount <= 0) {
      setAddGoalError('Please enter a valid target amount.');
      return;
    }

    if (
      !Number.isFinite(numericMonthlyContribution) ||
      numericMonthlyContribution <= 0
    ) {
      setAddGoalError('Please enter a valid monthly contribution.');
      return;
    }

    if (numericMonthlyContribution > numericTargetAmount) {
      setAddGoalError(
        'Monthly contribution cannot be greater than the target amount.',
      );
      return;
    }

    if (!newTargetDate) {
      setAddGoalError('Please select a target date.');
      return;
    }

    const selectedDate = new Date(`${newTargetDate}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setAddGoalError('Target date must be today or a future date.');
      return;
    }

    try {
      setAddingGoal(true);

      const response = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: trimmedName,
          account_id: newAccountId,
          target_amount: numericTargetAmount,
          saved_amount: 0,
          monthly_contribution: numericMonthlyContribution,
          target_date: newTargetDate,
          status: 'active',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to create goal.');
      }

      const createdGoal = normalizeGoal(responseData as RawGoal);

      setGoals((currentGoals) => [...currentGoals, createdGoal]);

      closeAddGoal();
    } catch (addError) {
      console.error('Failed to create goal:', addError);

      setAddGoalError(
        addError instanceof Error ? addError.message : 'Failed to create goal.',
      );
    } finally {
      setAddingGoal(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * START INLINE EDIT
   * ---------------------------------------------------------
   */

  const startEditingGoal = (goal: Goal) => {
    setShowAddGoal(false);

    setEditingGoalId(goal.id);

    setEditGoalName(goal.name);
    setEditAccountId(goal.accountId);
    setEditTargetAmount(String(goal.targetAmount));
    setEditMonthlyContribution(String(goal.monthlyContribution));
    setEditTargetDate(goal.targetDate);

    setEditError('');
  };

  /*
   * ---------------------------------------------------------
   * CANCEL INLINE EDIT
   * ---------------------------------------------------------
   */

  const cancelEditingGoal = () => {
    if (savingGoal) {
      return;
    }

    setEditingGoalId(null);

    setEditGoalName('');
    setEditAccountId('');
    setEditTargetAmount('');
    setEditMonthlyContribution('');
    setEditTargetDate('');

    setEditError('');
  };

  /*
   * ---------------------------------------------------------
   * SAVE INLINE EDIT
   * ---------------------------------------------------------
   */

  const saveEditedGoal = async (goal: Goal) => {
    setEditError('');

    const trimmedName = editGoalName.trim();

    const numericTargetAmount = Number(editTargetAmount);

    const numericMonthlyContribution = Number(editMonthlyContribution);

    if (!trimmedName) {
      setEditError('Please enter a goal name.');
      return;
    }

    if (!editAccountId) {
      setEditError('Please select an account.');
      return;
    }

    if (!Number.isFinite(numericTargetAmount) || numericTargetAmount <= 0) {
      setEditError('Please enter a valid target amount.');
      return;
    }

    if (
      !Number.isFinite(numericMonthlyContribution) ||
      numericMonthlyContribution <= 0
    ) {
      setEditError('Please enter a valid monthly contribution.');
      return;
    }

    if (numericMonthlyContribution > numericTargetAmount) {
      setEditError(
        'Monthly contribution cannot be greater than the target amount.',
      );
      return;
    }

    if (!editTargetDate) {
      setEditError('Please select a target date.');
      return;
    }

    const selectedDate = new Date(`${editTargetDate}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setEditError('Target date must be today or a future date.');
      return;
    }

    /*
     * Preserve saved amount.
     */

    const savedAmount = Math.min(goal.savedAmount, numericTargetAmount);

    try {
      setSavingGoal(true);

      const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: trimmedName,

          account_id: editAccountId,

          target_amount: numericTargetAmount,

          saved_amount: savedAmount,

          monthly_contribution: numericMonthlyContribution,

          target_date: editTargetDate,

          status: savedAmount >= numericTargetAmount ? 'completed' : 'active',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to update goal.');
      }

      const updatedGoal = normalizeGoal(responseData as GoalResponse);

      setGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === updatedGoal.id ? updatedGoal : currentGoal,
        ),
      );

      cancelEditingGoal();
    } catch (updateError) {
      console.error('Failed to update goal:', updateError);

      setEditError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update goal.',
      );
    } finally {
      setSavingGoal(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE GOAL
   * ---------------------------------------------------------
   */

  const deleteGoal = async (goal: Goal) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setDeletingGoalId(goal.id);

      const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to delete goal.');
      }

      setGoals((currentGoals) =>
        currentGoals.filter((currentGoal) => currentGoal.id !== goal.id),
      );

      if (editingGoalId === goal.id) {
        cancelEditingGoal();
      }
    } catch (deleteError) {
      console.error('Failed to delete goal:', deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete goal.',
      );
    } finally {
      setDeletingGoalId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * CONTRIBUTION
   * ---------------------------------------------------------
   */

  const openContributionModal = (goal: Goal) => {
    const defaultAmount =
      goal.monthlyContribution > 0 ? goal.monthlyContribution : '';

    setContributionAmount(defaultAmount.toString());

    setContributionGoal(goal);
  };

  const closeContributionModal = () => {
    if (contributionSaving) {
      return;
    }

    setContributionGoal(null);
    setContributionAmount('');
  };

  const addContribution = async () => {
    if (!contributionGoal) {
      return;
    }

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Contribution amount must be greater than zero.');
      return;
    }

    try {
      setContributionSaving(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/goals/${contributionGoal.id}/contribute`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            amount,
          }),
        },
      );

      const responseData = (await response.json()) as
        | GoalResponse
        | { detail?: string };

      if (!response.ok) {
        throw new Error(
          'detail' in responseData && responseData.detail
            ? responseData.detail
            : 'Failed to add contribution.',
        );
      }

      const updatedGoal = normalizeGoal(responseData as GoalResponse);

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === updatedGoal.id ? updatedGoal : goal,
        ),
      );

      setContributionGoal(null);
      setContributionAmount('');
    } catch (contributionError) {
      console.error('Failed to add contribution:', contributionError);

      setError(
        contributionError instanceof Error
          ? contributionError.message
          : 'Failed to add contribution.',
      );
    } finally {
      setContributionSaving(false);
    }
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
          <p className="text-sm text-slate-500">Loading goals...</p>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-[calc(100vh-64px)] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* -------------------------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------------------------- */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Goals</h1>

            <p className="mt-1 text-sm text-slate-500">
              Plan what you're saving for and track whether you're on schedule.
            </p>
          </div>

          <button
            type="button"
            onClick={showAddGoal ? closeAddGoal : openAddGoal}
            disabled={accounts.length === 0}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showAddGoal ? <X size={17} /> : <Plus size={17} />}

            {showAddGoal ? 'Cancel' : 'Add Goal'}
          </button>
        </div>

        {/* -------------------------------------------------- */}
        {/* ERROR */}
        {/* -------------------------------------------------- */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* ADD GOAL INLINE FORM */}
        {/* -------------------------------------------------- */}

        {showAddGoal && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Add Goal</h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a new savings goal without leaving this page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* NAME */}

              <div className="lg:col-span-2">
                <label
                  htmlFor="new-goal-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Goal Name
                </label>

                <input
                  id="new-goal-name"
                  type="text"
                  value={newGoalName}
                  onChange={(event) => setNewGoalName(event.target.value)}
                  placeholder="e.g. New Laptop"
                  disabled={addingGoal}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* ACCOUNT */}

              <div>
                <label
                  htmlFor="new-goal-account"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Account
                </label>

                <select
                  id="new-goal-account"
                  value={newAccountId}
                  onChange={(event) => setNewAccountId(event.target.value)}
                  disabled={addingGoal}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">Select account</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET */}

              <div>
                <label
                  htmlFor="new-target-amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Target Amount
                </label>

                <input
                  id="new-target-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newTargetAmount}
                  onChange={(event) => setNewTargetAmount(event.target.value)}
                  placeholder="80000"
                  disabled={addingGoal}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* MONTHLY */}

              <div>
                <label
                  htmlFor="new-monthly-contribution"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Monthly Contribution
                </label>

                <input
                  id="new-monthly-contribution"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newMonthlyContribution}
                  onChange={(event) =>
                    setNewMonthlyContribution(event.target.value)
                  }
                  placeholder="10000"
                  disabled={addingGoal}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* DATE */}

              <div>
                <label
                  htmlFor="new-target-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Target Date
                </label>

                <input
                  id="new-target-date"
                  type="date"
                  value={newTargetDate}
                  onChange={(event) => setNewTargetDate(event.target.value)}
                  disabled={addingGoal}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            {addGoalError && (
              <p className="mt-4 text-sm text-red-600">{addGoalError}</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={addGoal}
                disabled={addingGoal}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />

                {addingGoal ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* OVERVIEW */}
        {/* -------------------------------------------------- */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <Target size={18} />

              <span className="text-sm">Active Goals</span>
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              {activeGoals.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <CircleDollarSign size={18} />

              <span className="text-sm">Total Saved</span>
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              {formatAmount(totalSaved)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              of {formatAmount(totalTarget)} total targets
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <Check size={18} />

              <span className="text-sm">Completed</span>
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              {completedGoals.length}
            </p>
          </div>
        </div>

        {/* -------------------------------------------------- */}
        {/* EMPTY STATE */}
        {/* -------------------------------------------------- */}

        {goals.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Target size={40} className="mx-auto text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No goals yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first savings goal and SaversStop will calculate how
              much you need to save each month.
            </p>

            <button
              type="button"
              onClick={openAddGoal}
              disabled={accounts.length === 0}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Create Goal
            </button>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* GOALS */}
        {/* -------------------------------------------------- */}

        <div className="space-y-5">
          {analyses.map(({ goal, analysis }) => {
            const status = statusConfig[analysis.status];

            const isEditing = editingGoalId === goal.id;

            const isDeleting = deletingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                {/* ================================================= */}
                {/* INLINE EDIT FORM */}
                {/* ================================================= */}

                {isEditing ? (
                  <div className="p-6">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Edit Goal
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Update this goal without leaving the Goals page.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={cancelEditingGoal}
                        disabled={savingGoal}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Cancel editing"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      {/* NAME */}

                      <div className="lg:col-span-2">
                        <label
                          htmlFor={`edit-name-${goal.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Goal Name
                        </label>

                        <input
                          id={`edit-name-${goal.id}`}
                          type="text"
                          value={editGoalName}
                          onChange={(event) =>
                            setEditGoalName(event.target.value)
                          }
                          disabled={savingGoal}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>

                      {/* ACCOUNT */}

                      <div>
                        <label
                          htmlFor={`edit-account-${goal.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Account
                        </label>

                        <select
                          id={`edit-account-${goal.id}`}
                          value={editAccountId}
                          onChange={(event) =>
                            setEditAccountId(event.target.value)
                          }
                          disabled={savingGoal}
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        >
                          <option value="">Select account</option>

                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* TARGET */}

                      <div>
                        <label
                          htmlFor={`edit-target-${goal.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Target Amount
                        </label>

                        <input
                          id={`edit-target-${goal.id}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editTargetAmount}
                          onChange={(event) =>
                            setEditTargetAmount(event.target.value)
                          }
                          disabled={savingGoal}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>

                      {/* MONTHLY */}

                      <div>
                        <label
                          htmlFor={`edit-monthly-${goal.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Monthly Contribution
                        </label>

                        <input
                          id={`edit-monthly-${goal.id}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editMonthlyContribution}
                          onChange={(event) =>
                            setEditMonthlyContribution(event.target.value)
                          }
                          disabled={savingGoal}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>

                      {/* DATE */}

                      <div>
                        <label
                          htmlFor={`edit-date-${goal.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Target Date
                        </label>

                        <input
                          id={`edit-date-${goal.id}`}
                          type="date"
                          value={editTargetDate}
                          onChange={(event) =>
                            setEditTargetDate(event.target.value)
                          }
                          disabled={savingGoal}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>

                    {/* SAVED AMOUNT INFO */}

                    <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">
                        Current saved amount
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmount(goal.savedAmount)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        The saved amount will not be changed when you edit the
                        goal.
                      </p>
                    </div>

                    {/* EDIT ERROR */}

                    {editError && (
                      <p className="mt-4 text-sm text-red-600">{editError}</p>
                    )}

                    {/* EDIT ACTIONS */}

                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditingGoal}
                        disabled={savingGoal}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X size={16} />
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => saveEditedGoal(goal)}
                        disabled={savingGoal}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={16} />

                        {savingGoal ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ================================================= */}
                    {/* GOAL HEADER */}
                    {/* ================================================= */}

                    <div className="border-b border-slate-100 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-semibold text-slate-900">
                              {goal.name}
                            </h2>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            Track your progress toward this savings goal.
                          </p>
                        </div>

                        {/* ACTION BUTTONS */}

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingGoal(goal)}
                            disabled={savingGoal || deletingGoalId !== null}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteGoal(goal)}
                            disabled={savingGoal || deletingGoalId !== null}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={15} />

                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {/* PROGRESS */}

                      <div className="mt-6">
                        <div className="mb-2 flex items-end justify-between gap-4">
                          <div>
                            <span className="text-2xl font-semibold text-slate-900">
                              {formatAmount(goal.savedAmount)}
                            </span>

                            <span className="ml-1 text-sm text-slate-500">
                              / {formatAmount(goal.targetAmount)}
                            </span>
                          </div>

                          <span className="text-sm font-medium text-slate-600">
                            {analysis.progressPercentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{
                              width: `${Math.min(
                                analysis.progressPercentage,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* CALCULATIONS */}
                    {/* ================================================= */}

                    <div className="grid grid-cols-1 border-b border-slate-100 sm:grid-cols-2 lg:grid-cols-4">
                      {/* REMAINING */}

                      <div className="border-b border-slate-100 p-5 sm:border-r lg:border-b-0">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <CircleDollarSign size={15} />
                          Remaining
                        </div>

                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatAmount(analysis.remainingAmount)}
                        </p>
                      </div>

                      {/* REQUIRED */}

                      <div className="border-b border-slate-100 p-5 lg:border-r lg:border-b-0">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <TrendingUp size={15} />
                          Monthly Required
                        </div>

                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatAmount(analysis.requiredMonthlyContribution)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          To reach target on time
                        </p>
                      </div>

                      {/* PLAN */}

                      <div className="border-b border-slate-100 p-5 sm:border-r lg:border-b-0">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <CircleDollarSign size={15} />
                          Your Plan
                        </div>

                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatAmount(analysis.plannedContribution)}
                        </p>

                        <p
                          className={`mt-1 text-xs font-medium ${
                            analysis.contributionDifference >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {analysis.contributionDifference >= 0
                            ? `+${formatAmount(
                                analysis.contributionDifference,
                              )} vs required`
                            : `${formatAmount(
                                Math.abs(analysis.contributionDifference),
                              )} below required`}
                        </p>
                      </div>

                      {/* TARGET */}

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <CalendarDays size={15} />
                          Target
                        </div>

                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatGoalTargetDate(goal.targetDate)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {analysis.monthsAvailable} month
                          {analysis.monthsAvailable === 1 ? '' : 's'} available
                        </p>
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* SMART ANALYSIS */}
                    {/* ================================================= */}

                    <div className="p-6">
                      {analysis.status === 'not_feasible' && (
                        <div className="mb-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                          <AlertTriangle
                            size={20}
                            className="mt-0.5 shrink-0 text-red-600"
                          />

                          <div>
                            <p className="font-medium text-red-800">
                              This goal needs a monthly contribution.
                            </p>

                            <p className="mt-1 text-sm text-red-700">
                              You need to save{' '}
                              <strong>
                                {formatAmount(
                                  analysis.requiredMonthlyContribution,
                                )}
                              </strong>{' '}
                              per month to reach{' '}
                              {formatAmount(goal.targetAmount)} by{' '}
                              {formatGoalTargetDate(goal.targetDate)}.
                            </p>
                          </div>
                        </div>
                      )}

                      {analysis.status === 'behind' && (
                        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <AlertTriangle
                            size={20}
                            className="mt-0.5 shrink-0 text-amber-600"
                          />

                          <div>
                            <p className="font-medium text-amber-800">
                              Your current contribution isn't enough.
                            </p>

                            <p className="mt-1 text-sm text-amber-700">
                              Increase your contribution to approximately{' '}
                              <strong>
                                {formatAmount(
                                  analysis.requiredMonthlyContribution,
                                )}
                              </strong>{' '}
                              per month to reach the goal on time.
                            </p>
                          </div>
                        </div>
                      )}

                      {analysis.status === 'ahead' && (
                        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="font-medium text-blue-800">
                            ✓ You're ahead of schedule.
                          </p>

                          <p className="mt-1 text-sm text-blue-700">
                            {getStatusMessage(
                              analysis.status,
                              analysis.monthsEarly,
                              analysis.monthsLate,
                            )}
                          </p>
                        </div>
                      )}

                      {analysis.status === 'on_track' && (
                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <p className="font-medium text-emerald-800">
                            ✓ You're on track.
                          </p>

                          <p className="mt-1 text-sm text-emerald-700">
                            {getStatusMessage(
                              analysis.status,
                              analysis.monthsEarly,
                              analysis.monthsLate,
                            )}
                          </p>
                        </div>
                      )}

                      {analysis.status === 'completed' && (
                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <p className="font-medium text-emerald-800">
                            ✓ Goal completed.
                          </p>

                          <p className="mt-1 text-sm text-emerald-700">
                            You've saved enough to reach your target.
                          </p>
                        </div>
                      )}

                      {/* PROJECTION */}

                      <div className="flex flex-col gap-5 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <Clock size={20} className="mt-0.5 text-slate-500" />

                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Projected completion
                            </p>

                            {analysis.projectedCompletionDate ? (
                              <p className="mt-1 text-sm text-slate-500">
                                At your current contribution rate, you'll reach
                                this goal around{' '}
                                <span className="font-medium text-slate-700">
                                  {formatGoalDate(
                                    analysis.projectedCompletionDate,
                                  )}
                                </span>
                                .
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-slate-500">
                                Set a monthly contribution to calculate your
                                projected completion date.
                              </p>
                            )}
                          </div>
                        </div>

                        {analysis.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => openContributionModal(goal)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={contributionSaving}
                          >
                            <Plus size={16} />
                            Add Contribution
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================== */}
      {/* CONTRIBUTION MODAL */}
      {/* ====================================================== */}

      {contributionGoal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add Contribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {contributionGoal.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeContributionModal}
                disabled={contributionSaving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contribution amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={contributionAmount}
                onChange={(event) => setContributionAmount(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="10000"
                autoFocus
                disabled={contributionSaving}
              />

              <p className="mt-2 text-xs text-slate-500">
                Current saved amount:{' '}
                {formatAmount(contributionGoal.savedAmount)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Remaining:{' '}
                {formatAmount(
                  Math.max(
                    contributionGoal.targetAmount -
                      contributionGoal.savedAmount,
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeContributionModal}
                disabled={contributionSaving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addContribution}
                disabled={contributionSaving}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contributionSaving ? 'Saving...' : 'Add Contribution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Goals;
