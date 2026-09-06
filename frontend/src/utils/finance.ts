import type { Transaction } from '../types';

/*
 * Self transfers are represented by two transactions
 * sharing the same transferId.
 *
 * They should not be counted as income or expenses.
 */
export const isSelfTransfer = (transaction: Transaction): boolean => {
  return transaction.transferId !== undefined;
};

/*
 * Returns only transactions that affect income/expenses.
 */
export const getFinancialTransactions = (
  transactions: Transaction[],
): Transaction[] => {
  return transactions.filter((transaction) => !isSelfTransfer(transaction));
};

/*
 * Total income.
 */
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return getFinancialTransactions(transactions)
    .filter((transaction) => transaction.type === 'received')
    .reduce((total, transaction) => total + transaction.amount, 0);
};

/*
 * Total expenses.
 */
export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return getFinancialTransactions(transactions)
    .filter((transaction) => transaction.type === 'sent')
    .reduce((total, transaction) => total + transaction.amount, 0);
};

/*
 * Net savings.
 *
 * Positive = income is greater than expenses.
 * Negative = expenses are greater than income.
 */
export const calculateNetSavings = (transactions: Transaction[]): number => {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);

  return income - expenses;
};

/*
 * Savings rate as a percentage.
 */
export const calculateSavingsRate = (transactions: Transaction[]): number => {
  const income = calculateTotalIncome(transactions);
  const savings = calculateNetSavings(transactions);

  if (income === 0) {
    return 0;
  }

  return (savings / income) * 100;
};

/*
 * Format a date into YYYY-MM.
 */
export const getMonthKey = (date: string): string => {
  return date.substring(0, 7);
};

/*
 * Format YYYY-MM into a readable month.
 */
export const formatMonth = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');

  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
};

/*
 * Get the last N months including the current month.
 *
 * This is useful for analytics even when there
 * are no transactions in some months.
 */
export const getRecentMonths = (count: number): string[] => {
  const months: string[] = [];

  const now = new Date();

  for (let index = count - 1; index >= 0; index--) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    months.push(`${year}-${month}`);
  }

  return months;
};
