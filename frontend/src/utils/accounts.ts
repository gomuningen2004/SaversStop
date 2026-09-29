import type {
  Account,
  AccountClassification,
  AccountType,
  RawAccount,
  RawAccountType,
} from '../types';

/*
 * ---------------------------------------------------------
 * CURRENCY
 * ---------------------------------------------------------
 */

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

/*
 * ---------------------------------------------------------
 * NORMALIZATION
 * ---------------------------------------------------------
 *
 * Converts API naming conventions such as:
 *
 * account_type_id
 * current_balance
 *
 * into the frontend naming convention:
 *
 * accountTypeId
 * currentBalance
 */

export function normalizeAccount(rawAccount: RawAccount): Account {
  return {
    id: rawAccount.id,
    name: rawAccount.name,
    accountTypeId: rawAccount.account_type_id,
    currentBalance: Number(rawAccount.current_balance),
    active: rawAccount.active,
  };
}

export function normalizeAccountType(
  rawAccountType: RawAccountType,
): AccountType {
  return {
    id: rawAccountType.id,
    name: rawAccountType.name,
    classification: rawAccountType.classification,
    active: rawAccountType.active,
  };
}

/*
 * ---------------------------------------------------------
 * ACCOUNT TYPE
 * ---------------------------------------------------------
 */

export function getAccountType(
  account: Account,
  accountTypes: AccountType[],
): AccountType | undefined {
  return accountTypes.find(
    (accountType) => accountType.id === account.accountTypeId,
  );
}

/*
 * ---------------------------------------------------------
 * ACCOUNT CLASSIFICATION
 * ---------------------------------------------------------
 */

export function getAccountClassification(
  account: Account,
  accountTypes: AccountType[],
): AccountClassification | undefined {
  return getAccountType(account, accountTypes)?.classification;
}

/*
 * ---------------------------------------------------------
 * ACTIVE ACCOUNTS
 * ---------------------------------------------------------
 */

export function getActiveAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.active);
}

/*
 * ---------------------------------------------------------
 * ASSET ACCOUNTS
 * ---------------------------------------------------------
 */

export function getAssetAccounts(
  accounts: Account[],
  accountTypes: AccountType[],
): Account[] {
  return accounts.filter(
    (account) =>
      account.active &&
      getAccountClassification(account, accountTypes) === 'asset',
  );
}

/*
 * ---------------------------------------------------------
 * LIABILITY ACCOUNTS
 * ---------------------------------------------------------
 */

export function getLiabilityAccounts(
  accounts: Account[],
  accountTypes: AccountType[],
): Account[] {
  return accounts.filter(
    (account) =>
      account.active &&
      getAccountClassification(account, accountTypes) === 'liability',
  );
}

/*
 * ---------------------------------------------------------
 * TOTAL ASSETS
 * ---------------------------------------------------------
 */

export function calculateTotalAssets(accounts: Account[]): number {
  return accounts.reduce((total, account) => total + account.currentBalance, 0);
}

/*
 * ---------------------------------------------------------
 * TOTAL LIABILITIES
 * ---------------------------------------------------------
 */

export function calculateTotalLiabilities(accounts: Account[]): number {
  return accounts.reduce(
    (total, account) => total + Math.abs(account.currentBalance),
    0,
  );
}

/*
 * ---------------------------------------------------------
 * NET WORTH
 * ---------------------------------------------------------
 */

export function calculateNetWorth(
  totalAssets: number,
  totalLiabilities: number,
): number {
  return totalAssets - totalLiabilities;
}
