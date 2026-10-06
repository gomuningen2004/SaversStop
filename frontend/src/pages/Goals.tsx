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

import GoalAddForm from '../components/goals/GoalAddForm';
import GoalContributionModal from '../components/goals/GoalContributionModal';

import useGoalsPage from '../hooks/useGoalsPage';

function Goals() {
  const {
    formatAmount,
    getStatusMessage,
    formatGoalDate,
    formatGoalTargetDate,
    statusConfig,
    handleEditGoalNameChange,
    handleEditAccountChange,
    handleEditTargetAmountChange,
    handleEditMonthlyContributionChange,
    handleEditTargetDateChange,
    goals,
    accounts,
    loading,
    error,
    editingGoalId,
    editGoalName,
    editAccountId,
    editTargetAmount,
    editMonthlyContribution,
    editTargetDate,
    editError,
    savingGoal,
    showAddGoal,
    newGoalName,
    setNewGoalName,
    newAccountId,
    setNewAccountId,
    newTargetAmount,
    setNewTargetAmount,
    newMonthlyContribution,
    setNewMonthlyContribution,
    newTargetDate,
    setNewTargetDate,
    addGoalError,
    addingGoal,
    deletingGoalId,
    contributionGoal,
    contributionAmount,
    setContributionAmount,
    contributionSaving,
    analyses,
    totalTarget,
    totalSaved,
    activeGoals,
    completedGoals,
    openAddGoal,
    closeAddGoal,
    addGoal,
    cancelEditingGoal,
    getSaveEditedGoalHandler,
    getStartEditingGoalHandler,
    getDeleteGoalHandler,
    getOpenContributionModalHandler,
    closeContributionModal,
    addContribution,
  } = useGoalsPage();

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
          <GoalAddForm
            accounts={accounts}
            name={newGoalName}
            accountId={newAccountId}
            targetAmount={newTargetAmount}
            monthlyContribution={newMonthlyContribution}
            targetDate={newTargetDate}
            error={addGoalError}
            saving={addingGoal}
            onNameChange={setNewGoalName}
            onAccountChange={setNewAccountId}
            onTargetAmountChange={setNewTargetAmount}
            onMonthlyContributionChange={setNewMonthlyContribution}
            onTargetDateChange={setNewTargetDate}
            onSubmit={addGoal}
          />
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
                          onChange={handleEditGoalNameChange}
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
                          onChange={handleEditAccountChange}
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
                          onChange={handleEditTargetAmountChange}
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
                          onChange={handleEditMonthlyContributionChange}
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
                          onChange={handleEditTargetDateChange}
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
                        onClick={getSaveEditedGoalHandler(goal)}
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
                            onClick={getStartEditingGoalHandler(goal)}
                            disabled={savingGoal || deletingGoalId !== null}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={getDeleteGoalHandler(goal)}
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
                            onClick={getOpenContributionModalHandler(goal)}
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
        <GoalContributionModal
          goal={contributionGoal}
          amount={contributionAmount}
          saving={contributionSaving}
          formatAmount={formatAmount}
          onAmountChange={setContributionAmount}
          onClose={closeContributionModal}
          onSubmit={addContribution}
        />
      )}

    </main>
  );
}

export default Goals;
