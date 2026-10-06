import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Account } from '../../types';

type AccountBalancesProps = {
  accounts: Account[];
  totalFunds: number;
};

const positiveColor = '#059669';
const negativeColor = '#e11d48';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function AccountBalances({ accounts, totalFunds }: AccountBalancesProps) {
  const positiveBalances = accounts.reduce(
    (total, account) =>
      account.currentBalance > 0 ? total + account.currentBalance : total,
    0,
  );
  const negativeBalances = accounts.reduce(
    (total, account) =>
      account.currentBalance < 0 ? total + account.currentBalance : total,
    0,
  );
  const chartData = accounts.map((account) => ({
    name: account.name,
    value: account.currentBalance,
  }));
  const rangeLimit = Math.max(
    1,
    ...chartData.map((account) => Math.abs(account.value)),
  );
  const axisCurrencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">
            Account overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Your money
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Balances across your active accounts.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {accounts.length}{' '}
          {accounts.length === 1 ? 'active account' : 'active accounts'}
        </p>
      </header>

      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
        <div
          className={`p-5 sm:p-6 ${
            totalFunds < 0 ? 'bg-rose-50/70' : 'bg-emerald-50/70'
          }`}
        >
          <p className="text-sm font-medium text-slate-600">Net balance</p>
          <p
            className={`mt-2 break-words text-2xl font-semibold sm:text-3xl ${
              totalFunds < 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(totalFunds)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Across all active accounts
          </p>
        </div>

        <div className="border-t border-slate-200 p-5 sm:border-t-0 sm:p-6">
          <p className="text-sm font-medium text-slate-500">
            Positive balances
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-700">
            {formatCurrency(positiveBalances)}
          </p>
        </div>

        <div className="border-t border-slate-200 p-5 sm:border-t-0 sm:p-6">
          <p className="text-sm font-medium text-slate-500">
            Negative balances
          </p>
          <p className="mt-2 text-xl font-semibold text-rose-700">
            {formatCurrency(negativeBalances)}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
        <section className="min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Balance by account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Compare positive and negative balances.
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              No active accounts to display.
            </div>
          ) : (
            <div style={{ height: Math.max(250, accounts.length * 58) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    domain={[-rangeLimit, rangeLimit]}
                    tickFormatter={(value: number) =>
                      axisCurrencyFormatter.format(value)
                    }
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={105}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Bar dataKey="value" maxBarSize={28} radius={4}>
                    {chartData.map((account) => (
                      <Cell
                        key={account.name}
                        fill={account.value < 0 ? negativeColor : positiveColor}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current balance by account.
            </p>
          </div>

          {accounts.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No active accounts.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex min-w-0 items-center justify-between gap-4 py-4 first:pt-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        account.currentBalance < 0
                          ? 'bg-rose-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <span className="truncate text-sm font-medium text-slate-800">
                      {account.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-right text-sm font-semibold tabular-nums ${
                      account.currentBalance < 0
                        ? 'text-rose-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(account.currentBalance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AccountBalances;
