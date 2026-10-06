import CurrentPosition from '../components/forecast/CurrentPosition';
import ForecastBreakdown from '../components/forecast/ForecastBreakdown';
import ForecastExplanation from '../components/forecast/ForecastExplanation';
import ForecastHeader from '../components/forecast/ForecastHeader';
import ForecastMethodology from '../components/forecast/ForecastMethodology';
import ForecastMonthCards from '../components/forecast/ForecastMonthCards';
import { useForecastData } from '../hooks/useForecastData';

function Forecast() {
  const {
    forecast,
    loading,
    error,
    currentMonth,
    monthlyNet,
    formatCurrency,
    formatCompactCurrency,
  } = useForecastData();

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-8">
        <p className="text-sm text-slate-500">
          Calculating your financial forecast...
        </p>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error || !forecast) {
    return (
      <main className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-900">Forecast unavailable</h1>

            <p className="mt-1 text-sm text-red-700">
              {error ?? 'Something went wrong while calculating your forecast.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        <ForecastHeader />

        <CurrentPosition
          currentBalance={forecast.current_balance}
          income={forecast.current_month_income}
          spending={forecast.current_month_expenses}
          endOfMonthForecast={forecast.end_of_month_forecast}
          formatCurrency={formatCurrency}
        />

        {/* ===================================================
            FORECAST EXPLANATION
        =================================================== */}

        {currentMonth && (
          <ForecastExplanation
            month={currentMonth}
            monthlyNet={monthlyNet}
            formatCurrency={formatCurrency}
          />
        )}

        {/* ===================================================
            3 MONTH FORECAST
        =================================================== */}

        <ForecastMonthCards
          months={forecast.forecast_months}
          formatCurrency={formatCurrency}
          formatCompactCurrency={formatCompactCurrency}
        />

        {/* ===================================================
            BREAKDOWN
        =================================================== */}

        <ForecastBreakdown
          months={forecast.forecast_months}
          formatCurrency={formatCurrency}
          formatCompactCurrency={formatCompactCurrency}
        />

        {/* ===================================================
            METHODOLOGY
        =================================================== */}

        <ForecastMethodology methodology={forecast.methodology} />
      </div>
    </main>
  );
}

export default Forecast;
