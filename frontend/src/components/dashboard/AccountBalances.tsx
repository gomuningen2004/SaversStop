import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import type { Account } from '../../types';

type AccountBalancesProps = {
  accounts: Account[];
  totalFunds: number;
};

const chartColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function AccountBalances({ accounts, totalFunds }: AccountBalancesProps) {
  const chartData = accounts.map((account) => ({
    name: account.name,
    value: account.currentBalance,
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Your Money</h2>

        <p className="text-sm text-slate-500">
          Current balance across your accounts
        </p>
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="mx-auto h-95 w-full max-w-xl">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Accounts</h3>

            <p className="text-sm text-slate-500">
              Current balance by account
            </p>
          </div>

          <div className="space-y-3">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />

                  <span className="font-medium">{account.name}</span>
                </div>

                <span className="font-semibold">
                  {formatCurrency(account.currentBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountBalances;
