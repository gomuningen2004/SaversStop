export type GoalAnalysis = {
  remainingAmount: number;
  progressPercentage: number;

  monthsAvailable: number;
  requiredMonthlyContribution: number;

  plannedContribution: number;
  contributionDifference: number;

  monthsToComplete: number;
  projectedCompletionDate: Date | null;

  monthsEarly: number;
  monthsLate: number;

  status: 'completed' | 'on_track' | 'ahead' | 'behind' | 'not_feasible';
};

const getMonthDifference = (from: Date, to: Date): number => {
  const fromYear = from.getFullYear();
  const fromMonth = from.getMonth();

  const toYear = to.getFullYear();
  const toMonth = to.getMonth();

  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);

  result.setMonth(result.getMonth() + months);

  return result;
};

export const analyzeGoal = (
  targetAmount: number,
  savedAmount: number,
  monthlyContribution: number,
  targetDate: string,
): GoalAnalysis => {
  const today = new Date();

  const remainingAmount = Math.max(targetAmount - savedAmount, 0);

  const progressPercentage =
    targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;

  /*
   * The number of calendar months remaining
   * until the target month.
   *
   * Minimum is 1 so a goal created for the
   * current month does not produce division by zero.
   */
  const target = new Date(`${targetDate}T00:00:00`);

  const monthsAvailable = Math.max(getMonthDifference(today, target), 1);

  const requiredMonthlyContribution =
    remainingAmount > 0 ? remainingAmount / monthsAvailable : 0;

  /*
   * Already completed.
   */
  if (remainingAmount <= 0) {
    return {
      remainingAmount: 0,
      progressPercentage: 100,

      monthsAvailable,
      requiredMonthlyContribution: 0,

      plannedContribution: monthlyContribution,
      contributionDifference: monthlyContribution,

      monthsToComplete: 0,
      projectedCompletionDate: today,

      monthsEarly: 0,
      monthsLate: 0,

      status: 'completed',
    };
  }

  /*
   * No contribution means the goal cannot currently
   * be completed through the planned contribution.
   */
  if (monthlyContribution <= 0) {
    return {
      remainingAmount,
      progressPercentage,

      monthsAvailable,
      requiredMonthlyContribution,

      plannedContribution: monthlyContribution,
      contributionDifference: monthlyContribution - requiredMonthlyContribution,

      monthsToComplete: Infinity,
      projectedCompletionDate: null,

      monthsEarly: 0,
      monthsLate: monthsAvailable,

      status: 'not_feasible',
    };
  }

  const monthsToComplete = Math.ceil(remainingAmount / monthlyContribution);

  const projectedCompletionDate = addMonths(today, monthsToComplete);

  const contributionDifference =
    monthlyContribution - requiredMonthlyContribution;

  /*
   * If the current contribution reaches the goal
   * before the target date, the goal is ahead.
   */
  if (monthsToComplete < monthsAvailable) {
    return {
      remainingAmount,
      progressPercentage,

      monthsAvailable,
      requiredMonthlyContribution,

      plannedContribution: monthlyContribution,
      contributionDifference,

      monthsToComplete,
      projectedCompletionDate,

      monthsEarly: monthsAvailable - monthsToComplete,
      monthsLate: 0,

      status: 'ahead',
    };
  }

  /*
   * Exactly enough to reach the goal around
   * the target month.
   */
  if (monthsToComplete === monthsAvailable) {
    return {
      remainingAmount,
      progressPercentage,

      monthsAvailable,
      requiredMonthlyContribution,

      plannedContribution: monthlyContribution,
      contributionDifference,

      monthsToComplete,
      projectedCompletionDate,

      monthsEarly: 0,
      monthsLate: 0,

      status: 'on_track',
    };
  }

  /*
   * Contribution is insufficient for the target date.
   */
  return {
    remainingAmount,
    progressPercentage,

    monthsAvailable,
    requiredMonthlyContribution,

    plannedContribution: monthlyContribution,
    contributionDifference,

    monthsToComplete,
    projectedCompletionDate,

    monthsEarly: 0,
    monthsLate: monthsToComplete - monthsAvailable,

    status: 'behind',
  };
};

export const formatGoalDate = (date: Date | string): string => {
  const parsedDate = date instanceof Date ? date : new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export const formatGoalTargetDate = (date: string): string => {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};
