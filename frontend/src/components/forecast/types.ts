export type ForecastMonth = {
  month: string;
  label: string;
  starting_balance: number;
  ending_balance: number;
  historical_spending: number;
  expected_income: number;
  expected_expenses: number;
  goal_contributions: number;
  net_change: number;
};

export type CurrencyFormatter = (amount: number) => string;
