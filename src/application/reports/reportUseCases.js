const {
  transactionRepository,
  budgetRuleRepository,
} = require('../../infrastructure/database/repositories');

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

async function getBudgetRuleReport(query = {}) {
  const filters = buildPeriodFilters(query);
  const activeRule = await budgetRuleRepository.createDefaultIfNotExists();

  const incomeCents = await transactionRepository.sumByType('income', filters);
  const expenseByGroup = await transactionRepository.sumByBudgetGroup(filters);

  const spentByGroup = expenseByGroup.reduce((accumulator, item) => {
    accumulator[item._id] = item.totalCents;
    return accumulator;
  }, {});

  const groups = [
    {
      key: 'needs',
      label: BUDGET_GROUP_LABELS.needs,
      percent: activeRule.needsPercent,
    },
    {
      key: 'wants',
      label: BUDGET_GROUP_LABELS.wants,
      percent: activeRule.wantsPercent,
    },
    {
      key: 'investments',
      label: BUDGET_GROUP_LABELS.investments,
      percent: activeRule.investmentsPercent,
    },
  ].map((group) => {
    const limitCents = Math.round((incomeCents * group.percent) / 100);
    const spentCents = spentByGroup[group.key] || 0;
    const avaliableCents = Math.max(limitCents - spentCents, 0);
    const exceededCents = Math.max(spentCents - limitCents, 0);

    return {
      ...group,
      limitCents,
      spentCents,
      avaliableCents,
      exceededCents,
      limit: toMoney(limitCents),
      spent: toMoney(spentCents),
      avaliable: toMoney(avaliableCents),
      exceeced: toMoney(exceededCents),
    };
  });

  return {
    filters,
    incomeCents,
    income: toMoney(incomeCents),
    rule: {
      id: activeRule._id.toString(),
      needsPercent: activeRule.needsPercent,
      wantsPercent: activeRule.wantsPercent,
      investmentsPercent: activeRule.investmentsPercent,
      active: activeRule.active,
    },
    groups,
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