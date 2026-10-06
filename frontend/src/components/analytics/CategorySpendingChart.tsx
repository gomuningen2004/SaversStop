import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export type CategorySpending = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
};

type CategorySpendingChartProps = {
  categorySpending: CategorySpending[];
  donutData: CategorySpending[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function CategorySpendingChart({
  categorySpending,
  donutData,
}: CategorySpendingChartProps) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Spending by Category
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Where your money has been going.
        </p>
      </div>

      {categorySpending.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">No spending data available.</p>
        </div>
      ) : (
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={125}
                  paddingAngle={3}
                >
                  {donutData.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {donutData.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />

                  <span className="truncate text-sm font-medium capitalize text-slate-700">
                    {category.name}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(category.amount)}
                  </p>

                  <p className="text-xs text-slate-400">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default CategorySpendingChart;
