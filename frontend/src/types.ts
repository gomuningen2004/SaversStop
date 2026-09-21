/*
 * Account Types
 */

export type AccountClassification = 'asset' | 'liability';

export type AccountType = {
  id: string;
  name: string;
  classification: AccountClassification;
  active: boolean;
};

export type AccountTypesResponse = {
  accountTypes: AccountType[];
};

/*
 * Accounts
 */

export type Account = {
  id: string;
  name: string;
  accountTypeId: string;
  currentBalance: number;
  active: boolean;
};

export type AccountsResponse = {
  accounts: Account[];
};

/*
 * Categories
 */

export type Category = {
  id: string;
  name: string;
  active: boolean;
};

export type CategoriesResponse = {
  categories: Category[];
};

/*
 * Transfers
 */

export type Transfer = {
  id: string;
  transferDate: string;
};

export type TransfersResponse = {
  transfers: Transfer[];
};

/*
 * Transactions
 */

export type Transaction = {
  id: string;
  transactionDate: string;

  /*
   * Normal transactions can have a reason.
   * Self-transfers do not need one.
   */
  reason?: string | null;

  /*
   * References the category from categories.json
   */
  categoryId: string;

  /*
   * References the account from accounts.json
   */
  accountId: string;

  amount: number;

  type: 'sent' | 'received';

  /*
   * Present only for self-transfer transactions.
   * Normal transactions have null/undefined.
   */
  transferId?: string | null;
};

export type TransactionsResponse = {
  transactions: Transaction[];
};

/*
 * Goals
 */

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  monthlyContribution: number;
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
  id: string;
  name: string;
  active: boolean;
};

export type PeopleResponse = {
  people: Person[];
};

/*
 * Debt Interactions
 */

export type DebtInteraction = {
  id: string;
  personId: string;
  interactionDate: string;
  amount: number;
  type: 'owed_to_me' | 'payment_received' | 'i_owe' | 'payment_sent';
  reason: string;
};

export type DebtInteractionsResponse = {
  interactions: DebtInteraction[];
};

/*
 * Budgets
 */

export type Budget = {
  id: string;
  month: string;
  categoryId: string;
  amount: number;
};

export type BudgetsResponse = {
  budgets: Budget[];
};
