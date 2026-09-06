import type { Budget, Category, Transaction } from '../types';

export type BudgetStatus = 'safe' | 'warning' | 'critical' | 'exceeded';

export type BudgetAnalysis = {
  budget: Budget;
  category: Category | undefined;

  spent: number;
  remaining: number;
  percentageUsed: number;

  status: BudgetStatus;
  isExceeded: boolean;
};

const getMonthKey = (date: string): string => {
  return date.substring(0, 7);
};

const isSelfTransfer = (transaction: Transaction): boolean => {
  return transaction.transferId !== undefined;
};

export const calculateCategorySpending = (
  transactions: Transaction[],
  month: string,
): Map<number, number> => {
  const spending = new Map<number, number>();

  transactions.forEach((transaction) => {
    if (
      transaction.type !== 'sent' ||
      isSelfTransfer(transaction) ||
      getMonthKey(transaction.date) !== month
    ) {
      return;
    }

    const current = spending.get(transaction.categoryId) ?? 0;

    spending.set(transaction.categoryId, current + transaction.amount);
  });

  return spending;
};

export const getBudgetStatus = (percentageUsed: number): BudgetStatus => {
  if (percentageUsed >= 100) {
    return 'exceeded';
  }

  if (percentageUsed >= 90) {
    return 'critical';
  }

  if (percentageUsed >= 75) {
    return 'warning';
  }

  return 'safe';
};

export const analyzeBudget = (
  budget: Budget,
  category: Category | undefined,
  spent: number,
): BudgetAnalysis => {
  const remaining = budget.amount - spent;

  const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  return {
    budget,
    category,

    spent,
    remaining,
    percentageUsed,

    status: getBudgetStatus(percentageUsed),

    isExceeded: spent > budget.amount,
  };
};

export const analyzeBudgets = (
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  month: string,
): BudgetAnalysis[] => {
  const monthlyBudgets = budgets.filter((budget) => budget.month === month);

  const spending = calculateCategorySpending(transactions, month);

  return monthlyBudgets.map((budget) => {
    const category = categories.find((item) => item.id === budget.categoryId);

    const spent = spending.get(budget.categoryId) ?? 0;

    return analyzeBudget(budget, category, spent);
  });
};

export const getBudgetTotals = (analyses: BudgetAnalysis[]) => {
  const totalBudget = analyses.reduce(
    (total, item) => total + item.budget.amount,
    0,
  );

  const totalSpent = analyses.reduce((total, item) => total + item.spent, 0);

  const totalRemaining = totalBudget - totalSpent;

  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    percentageUsed,
  };
};

export const formatBudgetMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-');

  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export const getCurrentMonth = (): string => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getPreviousMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-');

  const date = new Date(Number(year), Number(monthNumber) - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}`;
};
