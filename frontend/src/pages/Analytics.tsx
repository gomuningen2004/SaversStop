import AnalyticsSummary from '../components/analytics/AnalyticsSummary';
import CategorySpendingChart from '../components/analytics/CategorySpendingChart';
import MonthlyIncomeExpenses from '../components/analytics/MonthlyIncomeExpenses';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

function Analytics() {
  const {
    loading,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    categorySpending,
    donutData,
    monthlyData,
  } = useAnalyticsData();

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>

          <p className="mt-1 text-sm text-slate-500">
            Understand where your money is going.
          </p>
        </div>

        {/* SUMMARY */}

        <AnalyticsSummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netSavings={netSavings}
          savingsRate={savingsRate}
        />

        {/* SPENDING BY CATEGORY */}

        <CategorySpendingChart
          categorySpending={categorySpending}
          donutData={donutData}
        />

        {/* INCOME VS EXPENSES */}

        <MonthlyIncomeExpenses monthlyData={monthlyData} />
      </div>
    </main>
  );
}

export default Analytics;
