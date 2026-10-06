import { Pencil, Plus, Settings, Target, Trash2 } from 'lucide-react';

import BudgetMonthSelector from '../components/budgets/BudgetMonthSelector';
import BudgetSummary from '../components/budgets/BudgetSummary';
import BudgetAlerts from '../components/budgets/BudgetAlerts';
import BudgetModal from '../components/budgets/BudgetModal';
import { useBudgetsPage } from '../hooks/useBudgetsPage';

function Budgets() {
  const {
    analyses, amount, availableCategories, categories, categoryId, changeMonth,
    closeModal, criticalBudgets, deleteBudget, editingBudget, formatAmount,
    formatBudgetMonth, getBudgetProgress, getCurrentMonth, loading,
    navigateToManageCategories, openAddModal, openEditModal, saveBudget,
    selectedMonth, setAmount, setCategoryId, setSelectedMonth, showModal,
    totals, warningBudgets,
  } = useBudgetsPage();

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
              onClick={navigateToManageCategories}
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

        <BudgetMonthSelector
          month={selectedMonth}
          formatMonth={formatBudgetMonth}
          currentMonth={getCurrentMonth}
          onMonthChange={changeMonth}
          onSelectMonth={setSelectedMonth}
        />

        {/* Summary */}

        <BudgetSummary
          totalBudget={totals.totalBudget}
          totalSpent={totals.totalSpent}
          totalRemaining={totals.totalRemaining}
          percentageUsed={totals.percentageUsed}
          formatAmount={formatAmount}
        />

        {/* Alerts */}

        <BudgetAlerts
          criticalBudgets={criticalBudgets}
          warningBudgets={warningBudgets}
        />

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
                  const progress = getBudgetProgress(percentageUsed, status);

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
                            className={`h-full rounded-full transition-all ${progress.className}`}
                            style={{
                              width: `${progress.width}%`,
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
        <BudgetModal
          editingBudget={editingBudget}
          selectedMonth={selectedMonth}
          categories={categories}
          availableCategories={availableCategories}
          categoryId={categoryId}
          amount={amount}
          formatMonth={formatBudgetMonth}
          onCategoryChange={setCategoryId}
          onAmountChange={setAmount}
          onClose={closeModal}
          onSave={saveBudget}
        />
      )}
    </main>
  );
}

export default Budgets;
