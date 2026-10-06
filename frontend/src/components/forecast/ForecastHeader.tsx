import { TrendingUp } from 'lucide-react';

function ForecastHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <TrendingUp size={21} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Financial Forecast
          </h1>

          <p className="text-sm text-slate-500">
            See where your finances are heading.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForecastHeader;
