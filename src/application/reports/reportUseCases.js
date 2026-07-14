
const {
  transactionRepository,
  budgetRuleRepository,
} = require('../../infrastructure/database/repositories');

const {
  calculateBudgetRuleRollover,
} = require('../../domain/rollover/rolloverCalculator');

const BUDGET_GROUP_LABELS = {
  needs: 'Necessidades/Custos',
  wants: 'Desejos',
  investments: 'Investimentos',
};

function toMoney(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function normalizeMonth(month) {
  if (month === undefined || month === null || month === '') {
    return undefined;
  }

  const parsedMonth = Number(month);

  if(!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    const error = new TypeError('O mês deve ser um número entre 1 e 12.');
    error.statusCode = 400;
    throw error;
  }

  return parsedMonth;
}

function normalizeYear(year) {
  if (year === undefined || year === null || year === '') {
    return undefined;
  }

  const parsedYear = Number(year);

  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
    const error = new TypeError('O ano informado é inválido.');
    error.statusCode = 400;
    throw error;
  }

  return parsedYear;
}

function buildPeriodFilters(query = {}) {
  const month = normalizeMonth(query.month);
  const year = normalizeYear(query.year);

  return {
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };
}

function formatCategoryReportItem(item) {
  return {
    categoryId: item._id.categoryId?.toString() || null,
    categoryName: item._id.categoryName,
    type: item._id.type,
    totalCents: item.totalCents,
    total: toMoney(item.totalCents),
    count: item.count,
  };
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function createMonthAccumulator(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');

    return {
      month: index + 1,
      period: `${year}-${month}`,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
      accumulatedBalanceCents: 0,
    };
  });
}

async function getSummaryReport(query = {}) {
  const filters = buildPeriodFilters(query);

  const incomeCents = await transactionRepository.sumByType('income', filters);
  const expenseCents = await transactionRepository.sumByType('expense', filters);
  const balanceCents = incomeCents - expenseCents;

  return {
    filters,
    incomeCents,
    expenseCents,
    balanceCents,
    income: toMoney(incomeCents),
    expense: toMoney(expenseCents),
    balance: toMoney(balanceCents),
  };
}

async function getCategoryReport(query = {}) {
  const filters = buildPeriodFilters(query);

  if (query.type) {
      filters.type = query.type;
  }

  const result = await transactionRepository.sumByCategory(filters);

  return {
    filters,
    categories: result.map(formatCategoryReportItem),
  };
}

async function getCashFlowReport(query = {}) {
  const filters = buildPeriodFilters(query);

  const transactions = await transactionRepository.findAll(filters);

  const sortedTransactions = [...transactions].sort((a, b) => {
    return a.date.localeCompare(b.date);
  });

  let accumulatedCents = 0;

  const cashFlow = sortedTransactions.map((transaction) => {
    const variationCents =
      transaction.type === 'income'
        ? transaction.amountCents
        : -transaction.amountCents;

    accumulatedCents += variationCents;

    return {
      id: transaction._id?.toString(),
      date: transaction.date,
      type: transaction.type,
      categoryName: transaction.categoryName,
      description: transaction.description || '',
      variationCents,
      variation: toMoney(variationCents),
      accumulatedCents,
      accumulated: toMoney(accumulatedCents),
    };
  });

  return {
    filters,
    cashFlow,
  };
}

function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function groupTransactionByMonthForRollover(transactions = []) {
  const monthlyMap = new Map();

  transactions.forEach((transaction) => {
    const month = Number(transaction.date.slice(5, 7));

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        incomeCents: 0,
        spentByGroup: {
          needs: 0,
          wants: 0,
          investments: 0,
        },
      });
    }

    const summary = monthlyMap.get(month);

    if (transaction.type === 'income') {
      summary.incomeCents += transaction.amountCents;
    }

    if (transaction.type === 'expense' && transaction.budgetGroup) {
      summary.spentByGroup[transaction.budgetGroup] =
        Number(summary.spentByGroup[transaction.budgetGroup] || 0) +
        Number(transaction.amountCents || 0);
    }
  });

  return Array.from(monthlyMap.values()).sort((a, b) => a.month - b.month);
}

function formatRolloverGroup(group) {
  return {
    key: group.group,
    label: BUDGET_GROUP_LABELS[group.group],
    percent: group.percent,

    baseLimitCents: group.baseLimitCents,
    accumulatedLimitCents: group.accumulatedLimitCents,
    totalLimitCents: group.totalLimitCents,
    spentCents: group.spentCents,
    avaliableCents: group.avaliableCents,
    exceecedCents: group.exceecedCents,
    rolloverToNextMonthCents: group.rolloverToNextMonthCents,

    baseLimit: toMoney(group.baseLimitCents),
    accumulatedLimit: toMoney(group.accumulatedLimitCents),
    totalLimit: toMoney(group.totalLimitCents),
    spent: toMoney(group.spentCents),
    available: toMoney(group.availableCents),
    exceeded: toMoney(group.exceededCents),
    rolloverToNextMonth: toMoney(group.rolloverToNextMonthCents),

    // Compatibilidade com o formato antigo:
    limitCents: group.totalLimitCents,
    limit: toMoney(group.totalLimitCents),
  }
}

async function getBudgetRuleReport(query = {}) {
  const currentPeriod = getCurrentMonthYear();

  const targetMonth = normalizeMonth(query.month) || currentPeriod.month;
  const targetYear = normalizeYear(query.year) || currentPeriod.year;

  const activeRule = await budgetRuleRepository.createDefaultIfNotExists();

  const transactions = await transactionRepository.findAll({
    year: targetYear,
  });

  const monthlySummaries = groupTransactionByMonthForRollover(transactions);

  const rolloverResult = calculateBudgetRuleRollover({
    monthlySummaries,
    budgetRule: activeRule,
    targetMonth,
  });

  const targetMonthSummary = monthlySummaries.find(
    (summary) => summary.month === targetMonth
  );

  const incomeCents = targetMonthSummary?.incomeCents || 0;

  return {
    filters: {
      month: targetMonth,
      year: targetYear,
    },
    incomeCents,
    income: toMoney(incomeCents),
    rule: {
      id: activeRule._id?.toString(),
      needsPercent: activeRule.needsPercent,
      wantsPercent: activeRule.wantsPercent,
      investmentsPercent: activeRule.investmentsPercent,
      active: activeRule.active,
    },
    groups: rolloverResult.groups.map(formatRolloverGroup),
    rolloverHistory: rolloverResult.history.map((monthResult) => ({
      month: monthResult.month,
      incomeCents: monthResult.incomeCents,
      income: toMoney(monthResult.incomeCents),
      groups: monthResult.groups.map(formatRolloverGroup),
    })),
  };
}

async function getMonthlyEvolutionReport(query = {}) {
  const year = normalizeYear(query.year) || new Date().getFullYear();
  const transaction = await transactionRepository.findAll({ year });
  const monthlyData = createMonthAccumulator(year);

  transaction.forEach((transaction) => {
    const period = getMonthKey(transaction.date);
    const monthIndex = monthlyData.findIndex((item) => item.period === period);

    if (monthIndex === -1) return;

    if (transaction.type === 'expense') {
      monthlyData[monthIndex].expenseCents += transaction.amountCents;
    }
  });

  let accumulatedBalanceCents = 0;

  const evolution = monthlyData.map((item) => {
    const balanceCents = item.incomeCents - item.expenseCents;
    accumulatedBalanceCents += balanceCents;

    return {
      ...item,
      balanceCents,
      accumulatedBalanceCents,
      income: toMoney(item.incomeCents),
      expense: toMoney(item.expenseCents),
      balance: toMoney(balanceCents),
      accumulatedBalance: toMoney(accumulatedBalanceCents),
    };
  });

  return {
    year,
    evolution,
  };
}

module.exports = {
  getSummaryReport,
  getCategoryReport,
  getCashFlowReport,
  getBudgetRuleReport,
  getMonthlyEvolutionReport,
};