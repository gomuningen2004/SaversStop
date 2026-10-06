import { AlertTriangle, XCircle } from 'lucide-react';

import type { BudgetAnalysis } from '../../utils/budgets';

type BudgetAlertsProps = {
  criticalBudgets: BudgetAnalysis[];
  warningBudgets: BudgetAnalysis[];
};

function BudgetAlerts({
  criticalBudgets,
  warningBudgets,
}: BudgetAlertsProps) {
  return (
    <>
      {criticalBudgets.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex gap-3">
            <XCircle size={21} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Budget needs attention</p>
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
    </>
  );
}

export default BudgetAlerts;
