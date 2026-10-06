import AccountBalances from '../components/dashboard/AccountBalances';
import { useDashboardData } from '../hooks/useDashboardData';


function Dashboard() {
  const { sortedAccounts, totalFunds, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
      <AccountBalances accounts={sortedAccounts} totalFunds={totalFunds} />
    </main>
  );
}

export default Dashboard;
