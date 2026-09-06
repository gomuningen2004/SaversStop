import type { DebtInteraction, Person } from '../types';

export type PersonBalance = {
  person: Person;
  balance: number;
};

export type PeopleSummary = {
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  potentialSettlement: number;
};

export const calculateInteractionBalance = (
  interactions: DebtInteraction[],
): number => {
  return interactions.reduce((balance, interaction) => {
    switch (interaction.type) {
      case 'owed_to_me':
        return balance + interaction.amount;

      case 'payment_received':
        return balance - interaction.amount;

      case 'i_owe':
        return balance - interaction.amount;

      case 'payment_sent':
        return balance + interaction.amount;

      default:
        return balance;
    }
  }, 0);
};

export const calculatePersonBalance = (
  personId: number,
  interactions: DebtInteraction[],
): number => {
  const personInteractions = interactions.filter(
    (interaction) => interaction.personId === personId,
  );

  return calculateInteractionBalance(personInteractions);
};

export const calculatePeopleBalances = (
  people: Person[],
  interactions: DebtInteraction[],
): PersonBalance[] => {
  return people.map((person) => ({
    person,
    balance: calculatePersonBalance(person.id, interactions),
  }));
};

export const calculatePeopleSummary = (
  balances: PersonBalance[],
): PeopleSummary => {
  const totalReceivable = balances
    .filter(({ balance }) => balance > 0)
    .reduce((total, { balance }) => total + balance, 0);

  const totalPayable = balances
    .filter(({ balance }) => balance < 0)
    .reduce((total, { balance }) => total + Math.abs(balance), 0);

  return {
    totalReceivable,
    totalPayable,
    netPosition: totalReceivable - totalPayable,
    potentialSettlement: Math.min(totalReceivable, totalPayable),
  };
};

export const getBalanceLabel = (balance: number): string => {
  if (balance > 0) {
    return 'Owes you';
  }

  if (balance < 0) {
    return 'You owe';
  }

  return 'Settled';
};

export const getBalanceAmount = (balance: number): number => {
  return Math.abs(balance);
};
