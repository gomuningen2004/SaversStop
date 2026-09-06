import type {
  Account,
  Goal,
  RecurringTransaction,
  Transaction,
} from '../types';

export type ForecastMonth = {
  month: string;
  label: string;
  startingBalance: number;

  historicalSpending: number;
  recurringIncome: number;
  recurringExpenses: number;
  goalContributions: number;

  expectedIncome: number;
  expectedExpenses: number;
  netChange: number;
  endingBalance: number;
};

export type ForecastSummary = {
  currentBalance: number;

  currentMonthIncome: number;
  currentMonthExpenses: number;

  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;

  recurringMonthlyIncome: number;
  recurringMonthlyExpenses: number;

  monthlyGoalContributions: number;

  endOfMonthForecast: number;

  forecastMonths: ForecastMonth[];
};

const getMonthKey = (date: string): string => {
  return date.substring(0, 7);
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getMonthDifference = (start: Date, end: Date): number => {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
};

const getMonthKeyFromDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}`;
};

const formatMonth = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');

  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

const isSelfTransfer = (transaction: Transaction): boolean => {
  return transaction.transferId !== undefined;
};

const getFinancialTransactions = (
  transactions: Transaction[],
): Transaction[] => {
  return transactions.filter((transaction) => !isSelfTransfer(transaction));
};

const getMonthlyTotals = (transactions: Transaction[]) => {
  const financialTransactions = getFinancialTransactions(transactions);

  const monthlyIncome = new Map<string, number>();
  const monthlyExpenses = new Map<string, number>();

  financialTransactions.forEach((transaction) => {
    const month = getMonthKey(transaction.date);

    if (transaction.type === 'received') {
      monthlyIncome.set(
        month,
        (monthlyIncome.get(month) ?? 0) + transaction.amount,
      );
    }

    if (transaction.type === 'sent') {
      monthlyExpenses.set(
        month,
        (monthlyExpenses.get(month) ?? 0) + transaction.amount,
      );
    }
  });

  return {
    monthlyIncome,
    monthlyExpenses,
  };
};

const calculateHistoricalAverages = (
  transactions: Transaction[],
  months = 6,
) => {
  const { monthlyIncome, monthlyExpenses } = getMonthlyTotals(transactions);

  const availableMonths = new Set<string>();

  monthlyIncome.forEach((_, month) => availableMonths.add(month));

  monthlyExpenses.forEach((_, month) => availableMonths.add(month));

  const sortedMonths = Array.from(availableMonths).sort();

  const recentMonths = sortedMonths.slice(-months);

  if (recentMonths.length === 0) {
    return {
      averageIncome: 0,
      averageExpenses: 0,
    };
  }

  const totalIncome = recentMonths.reduce(
    (total, month) => total + (monthlyIncome.get(month) ?? 0),
    0,
  );

  const totalExpenses = recentMonths.reduce(
    (total, month) => total + (monthlyExpenses.get(month) ?? 0),
    0,
  );

  return {
    averageIncome: totalIncome / recentMonths.length,

    averageExpenses: totalExpenses / recentMonths.length,
  };
};

const getRecurringOccurrencesForMonth = (
  recurringTransactions: RecurringTransaction[],
  monthDate: Date,
) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  let income = 0;
  let expenses = 0;

  recurringTransactions
    .filter((transaction) => transaction.active)
    .forEach((transaction) => {
      const startDate = new Date(`${transaction.startDate}T00:00:00`);

      if (startDate > monthEnd) {
        return;
      }

      if (
        transaction.endDate &&
        new Date(`${transaction.endDate}T00:00:00`) < monthStart
      ) {
        return;
      }

      if (transaction.frequency === 'monthly') {
        const day = transaction.dayOfMonth ?? 1;

        const daysInMonth = monthEnd.getDate();

        if (day <= daysInMonth) {
          if (transaction.type === 'received') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }

        return;
      }

      if (transaction.frequency === 'yearly') {
        const startMonth = startDate.getMonth();

        if (startMonth === monthDate.getMonth()) {
          if (transaction.type === 'received') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }

        return;
      }

      if (transaction.frequency === 'weekly') {
        const daysInMonth =
          getMonthDifference(monthStart, monthEnd) === 0
            ? monthEnd.getDate()
            : 0;

        if (daysInMonth > 0) {
          const occurrences = Math.floor((daysInMonth + 6) / 7);

          const amount = transaction.amount * occurrences;

          if (transaction.type === 'received') {
            income += amount;
          } else {
            expenses += amount;
          }
        }

        return;
      }

      if (transaction.frequency === 'daily') {
        const days = monthEnd.getDate();

        const amount = transaction.amount * days;

        if (transaction.type === 'received') {
          income += amount;
        } else {
          expenses += amount;
        }
      }
    });

  return {
    income,
    expenses,
  };
};

const getGoalContributions = (goals: Goal[], monthDate: Date): number => {
  const monthEnd = endOfMonth(monthDate);

  return goals
    .filter(
      (goal) =>
        goal.status === 'active' &&
        new Date(`${goal.targetDate}T00:00:00`) >= monthEnd,
    )
    .reduce((total, goal) => total + goal.monthlyContribution, 0);
};

const getCurrentMonthActuals = (transactions: Transaction[]) => {
  const currentMonth = getMonthKeyFromDate(new Date());

  const financialTransactions = getFinancialTransactions(transactions);

  return financialTransactions
    .filter((transaction) => getMonthKey(transaction.date) === currentMonth)
    .reduce(
      (totals, transaction) => {
        if (transaction.type === 'received') {
          totals.income += transaction.amount;
        } else {
          totals.expenses += transaction.amount;
        }

        return totals;
      },
      {
        income: 0,
        expenses: 0,
      },
    );
};

export const calculateForecast = (
  accounts: Account[],
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
  goals: Goal[],
  forecastMonths = 3,
): ForecastSummary => {
  const currentBalance = accounts
    .filter((account) => account.active && account.classification === 'asset')
    .reduce((total, account) => total + account.balance, 0);

  const currentActuals = getCurrentMonthActuals(transactions);

  const historical = calculateHistoricalAverages(transactions, 6);

  const currentMonthDate = startOfMonth(new Date());

  const currentRecurring = getRecurringOccurrencesForMonth(
    recurringTransactions,
    currentMonthDate,
  );

  const monthlyGoalContributions = getGoalContributions(
    goals,
    currentMonthDate,
  );

  const forecast: ForecastMonth[] = [];

  let balance = currentBalance;

  for (let index = 0; index < forecastMonths; index++) {
    const monthDate = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + index,
      1,
    );

    const month = getMonthKeyFromDate(monthDate);

    const isCurrentMonth = index === 0;

    const recurring = getRecurringOccurrencesForMonth(
      recurringTransactions,
      monthDate,
    );

    /*
     * For the current month:
     *
     * Actual transactions already represent
     * money that has happened.
     *
     * Therefore we only forecast the
     * remaining part of the month.
     */
    let expectedIncome: number;
    let expectedExpenses: number;

    if (isCurrentMonth) {
      const daysRemaining = Math.max(
        0,
        endOfMonth(monthDate).getDate() - new Date().getDate(),
      );

      const totalDays = endOfMonth(monthDate).getDate();

      const remainingRatio = totalDays > 0 ? daysRemaining / totalDays : 0;

      const expectedRemainingNormalIncome = Math.max(
        0,
        historical.averageIncome - currentActuals.income,
      );

      const expectedRemainingNormalExpenses = Math.max(
        0,
        historical.averageExpenses - currentActuals.expenses,
      );

      expectedIncome =
        currentActuals.income +
        Math.min(
          expectedRemainingNormalIncome,
          historical.averageIncome * remainingRatio,
        ) +
        recurring.income;

      expectedExpenses =
        currentActuals.expenses +
        Math.min(
          expectedRemainingNormalExpenses,
          historical.averageExpenses * remainingRatio,
        ) +
        recurring.expenses +
        monthlyGoalContributions;
    } else {
      expectedIncome = historical.averageIncome + recurring.income;

      expectedExpenses =
        historical.averageExpenses +
        recurring.expenses +
        getGoalContributions(goals, monthDate);
    }

    const netChange = expectedIncome - expectedExpenses;

    balance += netChange;

    forecast.push({
      month,
      label: formatMonth(month),
      startingBalance: balance - netChange,
      historicalSpending: historical.averageExpenses,
      recurringIncome: recurring.income,
      recurringExpenses: recurring.expenses,
      goalContributions: isCurrentMonth
        ? monthlyGoalContributions
        : getGoalContributions(goals, monthDate),
      expectedIncome,
      expectedExpenses,
      netChange,
      endingBalance: balance,
    });
  }

  return {
    currentBalance,

    currentMonthIncome: currentActuals.income,

    currentMonthExpenses: currentActuals.expenses,

    averageMonthlyIncome: historical.averageIncome,

    averageMonthlyExpenses: historical.averageExpenses,

    recurringMonthlyIncome: currentRecurring.income,

    recurringMonthlyExpenses: currentRecurring.expenses,

    monthlyGoalContributions,

    endOfMonthForecast: forecast[0]?.endingBalance ?? currentBalance,

    forecastMonths: forecast,
  };
};
