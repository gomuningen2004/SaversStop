/*
 * Accounts
 */

export type AccountType =
  | 'bank'
  | 'cash'
  | 'wallet'
  | 'fixed_deposit'
  | 'investment'
  | 'credit_card'
  | 'loan';

export type AccountClassification = 'asset' | 'liability';

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  classification: AccountClassification;
  balance: number;
  active: boolean;
};

export type AccountsResponse = {
  accounts: Account[];
};

/*
 * Categories
 */

export type Category = {
  id: number;
  name: string;
};

export type CategoriesResponse = {
  categories: Category[];
};

/*
 * Transactions
 */

export type Transaction = {
  id: number;
  date: string;

  /*
   * Normal transactions have a reason.
   * Self transfers do not need one.
   */
  reason?: string;

  /*
   * References the category from categories.json
   */
  categoryId: number;

  account: string;
  amount: number;

  type: 'sent' | 'received';

  /*
   * Present only for self-transfer transactions.
   */
  transferId?: number;
};

export type TransactionsResponse = {
  transactions: Transaction[];
};

/*
 * Goals
 */

export type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  monthlyContribution: number;
  account: string;
  targetDate: string;
  status: 'active' | 'completed';
};

export type GoalsResponse = {
  goals: Goal[];
};

/*
 * People
 */

export type Person = {
  id: number;
  name: string;
};

export type PeopleResponse = {
  people: Person[];
};

/*
 * Debt interactions
 */

export type DebtInteraction = {
  id: number;
  personId: number;
  date: string;
  amount: number;
  type: 'owed_to_me' | 'payment_received' | 'i_owe' | 'payment_sent';
  reason: string;
};

export type DebtInteractionsResponse = {
  interactions: DebtInteraction[];
};

export type Budget = {
  id: number;
  month: string;
  categoryId: number;
  amount: number;
};

export type BudgetsResponse = {
  budgets: Budget[];
};

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurringTransaction = {
  id: number;
  name: string;
  amount: number;
  type: 'sent' | 'received';
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  account: string;
  categoryId: number;
  startDate: string;
  endDate?: string;
  active: boolean;
};

export type RecurringTransactionsResponse = {
  recurringTransactions: RecurringTransaction[];
};
