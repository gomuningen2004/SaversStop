import { useEffect, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import type { Account, AccountsResponse } from '../types';

const chartColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/data/accounts.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load account data');
        }

        return response.json();
      })
      .then((data: AccountsResponse) => {
        setAccounts(data.accounts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load account data.');
        setLoading(false);
      });
  }, []);

  const totalFunds = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  const sortedAccounts = [...accounts].sort((a, b) => b.balance - a.balance);

  const chartData = sortedAccounts.map((account) => ({
    name: account.name,
    value: account.balance,
  }));

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
    <>
      <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
        {/* Your Money */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Your Money</h2>

            <p className="text-sm text-slate-500">
              Current balance across your accounts
            </p>
          </div>

          {/* Chart + Accounts */}
          <div className="grid items-center gap-8 lg:grid-cols-2">
            {/* Donut Chart */}
            <div className="mx-auto h-95 w-full max-w-xl">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={105}
                    outerRadius={145}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />

                  {/* Center text */}
                  <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-900 text-2xl font-semibold"
                  >
                    {formatCurrency(totalFunds)}
                  </text>

                  <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-500 text-sm"
                  >
                    Total Funds
                  </text>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Accounts */}
            <div className="w-full">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Accounts</h3>

                <p className="text-sm text-slate-500">
                  Current balance by account
                </p>
              </div>

              <div className="space-y-3">
                {sortedAccounts.map((account, index) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />

                      <span className="font-medium">{account.name}</span>
                    </div>

                    <span className="font-semibold">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Dashboard;
