const BUDGET_GROUPS = ['needs', 'wants', 'investments'];

function getPercentByGroup(budgetRule, group) {
  const percentageMap = {
    needs: budgetRule.needsPercent,
    wants: budgetRule.wantsPercent,
    investments: budgetRule.investmentsPercent,
  };

  return Number(percentageMap[group] || 0);
}

function createEmptyGroupResult(group, percent) {
  return {
    group,
    percent,
    baseLimitCents: 0,
    accumulatedLimitCents: 0,
    totalLimitCents: 0,
    spentCents: 0,
    availableCents: 0,
    exceededCents: 0,
    rolloverToNextMonthCents: 0,
  };
}

function calculateMonthGroups({
  incomeCents,
  spentByGroup,
  budgetRule,
  previousRollover,
}) {
  const nextRollover = {};

  const groups = BUDGET_GROUPS.map((group) => {
    const percent = getPercentByGroup(budgetRule, group);
    const baseLimitCents = Math.round(
      (Number(incomeCents || 0) * percent) / 100
    );
    const accumulatedLimitCents = Number(previousRollover[group] || 0);
    const totalLimitCents = baseLimitCents + accumulatedLimitCents;
    const spentCents = Number(spentByGroup[group] || 0);

    const availableCents = Math.max(totalLimitCents - spentCents, 0);
    const exceededCents = Math.max(spentCents - totalLimitCents, 0);

    nextRollover[group] = availableCents;

    return {
      group,
      percent,
      baseLimitCents,
      accumulatedLimitCents,
      totalLimitCents,
      spentCents,
      availableCents,
      exceededCents,
      rolloverToNextMonthCents: availableCents,
    };
  });

  return {
    groups,
    nextRollover,
  };
}

function normalizeMonthlySummaries(monthlySummaries = []) {
  const summariesByMonth = new Map();

  monthlySummaries.forEach((summary) => {
    summariesByMonth.set(Number(summary.month), {
      month: Number(summary.month),
      incomeCents: Number(summary.incomeCents || 0),
      spentByGroup: {
        needs: Number(summary.spentByGroup?.needs || 0),
        wants: Number(summary.spentByGroup?.wants || 0),
        investments: Number(summary.spentByGroup?.investments || 0),
      },
    });
  });

  return summariesByMonth;
}

function calculateBudgetRuleRollover({
  monthlySummaries,
  budgetRule,
  targetMonth,
}) {
  const parsedTargetMonth = Number(targetMonth);

  if (
    !Number.isInteger(parsedTargetMonth) ||
    parsedTargetMonth < 1 ||
    parsedTargetMonth > 12
  ) {
    const error = new TypeError('O mês alvo do rollover deve ser entre 1 e 12.');
    error.statusCode = 400;
    throw error;
  }

  const summariesByMonth = normalizeMonthlySummaries(monthlySummaries);

  let previousRollover = {
    needs: 0,
    wants: 0,
    investments: 0,
  };

  const history = [];

  for (let month = 1; month <= parsedTargetMonth; month += 1) {
    const summary = summariesByMonth.get(month) || {
      month,
      incomeCents: 0,
      spentByGroup: {
        needs: 0,
        wants: 0,
        investments: 0,
      },
    };

    const result = calculateMonthGroups({
      incomeCents: summary.incomeCents,
      spentByGroup: summary.spentByGroup,
      budgetRule,
      previousRollover,
    });

    const monthResult = {
      month,
      incomeCents: summary.incomeCents,
      groups: result.groups,
    };

    history.push(monthResult);

    previousRollover = result.nextRollover;
  }

  const target = history.find((item) => item.month === parsedTargetMonth);

  return {
    targetMonth: parsedTargetMonth,
    groups:
      target?.groups ||
      BUDGET_GROUPS.map((group) =>
        createEmptyGroupResult(group, getPercentByGroup(budgetRule, group))
      ),
      history,
  };
}

module.exports = {
  BUDGET_GROUPS,
  calculateBudgetRuleRollover,
}