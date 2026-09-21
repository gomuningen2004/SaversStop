import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock,
  Pencil,
  Plus,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Goal, GoalsResponse } from '../types';
import {
  analyzeGoal,
  formatGoalDate,
  formatGoalTargetDate,
} from '../utils/goals';

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

function Goals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const [contributionAmount, setContributionAmount] = useState('');

  /*
   * Load and normalize goals.
   *
   * JSON uses snake_case while the frontend uses camelCase.
   */
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const response = await fetch('/data/goals.json');

        if (!response.ok) {
          throw new Error('Failed to load goals');
        }

        const data = (await response.json()) as {
          goals?: Array<{
            id: string;
            name: string;
            target_amount: number;
            saved_amount: number;
            monthly_contribution: number;
            target_date: string;
            status: 'active' | 'completed';
          }>;
        };

        const normalizedGoals: Goal[] = (data.goals ?? []).map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetAmount: Number(goal.target_amount),
          savedAmount: Number(goal.saved_amount),
          monthlyContribution: Number(goal.monthly_contribution),
          targetDate: goal.target_date,
          status: goal.status,
        }));

        setGoals(normalizedGoals);
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  /*
   * Analyze every goal.
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
   * Total target across all goals.
   */
  const totalTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );

  /*
   * Total amount currently saved across all goals.
   */
  const totalSaved = useMemo(
    () => goals.reduce((total, goal) => total + goal.savedAmount, 0),
    [goals],
  );

  /*
   * Active goals.
   */
  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'active'),
    [goals],
  );

  /*
   * Completed goals.
   */
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'completed'),
    [goals],
  );

  /*
   * Open contribution modal.
   */
  const openContributionModal = (goal: Goal) => {
    const defaultAmount =
      goal.monthlyContribution > 0 ? goal.monthlyContribution : '';

    setContributionAmount(defaultAmount.toString());
    setContributionGoal(goal);
  };

  /*
   * Close contribution modal.
   */
  const closeContributionModal = () => {
    setContributionGoal(null);
    setContributionAmount('');
  };

  /*
   * Add contribution.
   *
   * Currently this updates local React state only.
   * Persistence will be handled by the backend later.
   */
  const addContribution = () => {
    if (!contributionGoal) {
      return;
    }

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id !== contributionGoal.id) {
          return goal;
        }

        const newSavedAmount = goal.savedAmount + amount;

        const completed = newSavedAmount >= goal.targetAmount;

        return {
          ...goal,
          savedAmount: Math.min(newSavedAmount, goal.targetAmount),
          status: completed ? 'completed' : goal.status,
        };
      }),
    );

    closeContributionModal();
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-500">Loading goals...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Goals</h1>

            <p className="mt-1 text-sm text-slate-500">
              Plan what you're saving for and track whether you're on schedule.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/goals/manage')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Settings size={17} />
              Manage Goals
            </button>

            <button
              onClick={() => navigate('/goals/manage')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus size={17} />
              Add Goal
            </button>
          </div>
        </div>

        {/* Overview */}
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

        {/* Empty state */}
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
              onClick={() => navigate('/goals/manage')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus size={17} />
              Create Goal
            </button>
          </div>
        )}

        {/* Goals */}
        <div className="space-y-5">
          {analyses.map(({ goal, analysis }) => {
            const status = statusConfig[analysis.status];

            return (
              <div
                key={goal.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                {/* Goal header */}
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

                    <button
                      onClick={() => navigate(`/goals/manage?edit=${goal.id}`)}
                      className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  </div>

                  {/* Progress */}
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

                {/* Goal calculations */}
                <div className="grid grid-cols-1 border-b border-slate-100 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border-b border-slate-100 p-5 sm:border-r lg:border-b-0">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <CircleDollarSign size={15} />
                      Remaining
                    </div>

                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatAmount(analysis.remainingAmount)}
                    </p>
                  </div>

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

                {/* Smart analysis */}
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
                            {formatAmount(analysis.requiredMonthlyContribution)}
                          </strong>{' '}
                          per month to reach {formatAmount(goal.targetAmount)}{' '}
                          by {formatGoalTargetDate(goal.targetDate)}.
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
                            {formatAmount(analysis.requiredMonthlyContribution)}
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

                  {/* Projection */}
                  <div className="flex flex-col gap-5 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Clock size={20} className="mt-0.5 text-slate-500" />

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Projected completion
                        </p>

                        {analysis.projectedCompletionDate ? (
                          <p className="mt-1 text-sm text-slate-500">
                            At your current contribution rate, you'll reach this
                            goal around{' '}
                            <span className="font-medium text-slate-700">
                              {formatGoalDate(analysis.projectedCompletionDate)}
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
                        onClick={() => openContributionModal(goal)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        <Plus size={16} />
                        Add Contribution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contribution modal */}
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
                onClick={closeContributionModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
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
                onClick={closeContributionModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={addContribution}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add Contribution
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Goals;
