import { useEffect, useState } from 'react';

import type { ForecastMonth } from '../components/forecast/types';

type ForecastResponse = {
  current_balance: number;
  current_month: string;
  current_month_income: number;
  current_month_expenses: number;
  historical_months_used: number;
  historical_monthly_income: number;
  historical_monthly_spending: number;
  monthly_goal_contributions: number;
  end_of_month_forecast: number;
  forecast_months: ForecastMonth[];
  methodology: string;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatCompactCurrency(amount: number) {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
}

export function useForecastData() {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/forecast?months=3&history_months=6');

        if (!response.ok) {
          throw new Error(`Forecast request failed: ${response.status}`);
        }

        const data = (await response.json()) as ForecastResponse;

        setForecast(data);
      } catch (error) {
        console.error('Failed to load forecast:', error);
        setError('Unable to load your financial forecast.');
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, []);

  useEffect(() => {
    document.title = 'Financial Forecast | SaversStop';
  }, []);

  const currentMonth = forecast?.forecast_months[0];
  const monthlyNet = currentMonth?.net_change ?? 0;

  return {
    forecast,
    loading,
    error,
    currentMonth,
    monthlyNet,
    formatCurrency,
    formatCompactCurrency,
  };
}
