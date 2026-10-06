import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expenses: number;
};

type MonthlyIncomeExpensesProps = {
  monthlyData: MonthlyData[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function MonthlyIncomeExpenses({ monthlyData }: MonthlyIncomeExpensesProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Income vs Expenses
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare your monthly income and spending.
        </p>
      </div>

      <div className="h-87.5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="label" tick={{ fontSize: 12 }} />

            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${Number(value) / 1000}k`}
            />

            <Tooltip formatter={(value) => formatCurrency(Number(value))} />

            <Legend />

            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />

            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default MonthlyIncomeExpenses;
