const {
  transactionRepository,
  budgetRuleRepository,
  budgetGroupTransferRepository,
} = require('../../infrastructure/database/repositories');

const {
  calculateBudgetRuleRollover,
} = require('../../domain/rollover/rolloverCalculator');

const VALID_BUDGET_GROUPS = ['needs', 'wants', 'investments'];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toMoney(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function toCents(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw createHttpError('O valor da transferencia deve ser um número válido.');
  }

  if (number <= 0) {
    throw createHttpError('O valor da transferencia deve ser maior que zero.');
  }

  return Math.round(number * 100)
}

function normalizeMonth(month) {
  const parsedMonth = Number(month);

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw createHttpError('O mês deve ser um número entre 1 e 12.');
  }

  return parsedMonth;
}

function normalizeYear(year) {
  const parsedYear = Number(year);

  if (
    !Number.isInteger(parsedYear) ||
    parsedYear < 1900 ||
    parsedYear > 3000
  ) {
    throw createHttpError('O ano informado é inválido.');
  }

  return parsedYear;
}

function normalizeBudgetGroup(group, fieldName) {
  if (!VALID_BUDGET_GROUPS.includes(group)) {
    throw createHttpError(
      `${fieldName} deve ser needs, wants ou investments.`
    );
  }

  return group;
}

function normalizeDescription(description) {
  if (description === undefined || description === null) {
    return '';
  }

  return String(description).trim();
}

function formatTransfer(transfer) {
  return {
    id: transfer._id?.toString(),
    month: transfer.month,
    year: transfer.year,
    fromGroup: transfer.fromGroup,
    toGroup: transfer.toGroup,
    amountCents: transfer.amountCents,
    amount: toMoney(transfer.amountCents),
    description: transfer.description || '',
    createdAt: transfer.createdAt,
    updateAt: transfer.updateAt,
  };
}

function groupTransactionsByMonthForRollover(transactions = []) {
  const monthlyMap = new Map();

  transactions.forEach((transaction) => {
    const month = Number(transaction.date.slice(7, 5));

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
      summary.incomeCents += Number(transaction.amountCents || 0);
    }

    if (transaction.type === 'expense' && transaction.budgetGroup) {
      summary.spentByGroup[transaction.budgetGroup] =
        Number(summary.spentByGroup[transaction.budgetGroup] || 0) +
        Number(transaction.amountCents || 0);
    }
  });

  return Array.from(monthlyMap.values()).sort((a, b) => a.month - b.month);
}

function normalizeTransferFilters(filters = {}) {
  const normalizedFilters = {};

  if (filters.month !== undefined) {
    normalizedFilters.month = normalizeMonth(filters.month);
  }

  if (filters.year !== undefined) {
    normalizedFilters.year = normalizeYear(filters.year);
  }

  if (filters.fromGroup !== undefined) {
    normalizedFilters.fromGroup = normalizeBudgetGroup(
      filters.fromGroup,
      'O grupo de origem'
    );
  }

  if (filters.toGroup !== undefined) {
    normalizeFilters.toGroup = normalizeBudgetGroup(
      filters.toGroup,
      'O grupo de destino'
    );
  }

  return normalizeFilters;
}

async function getAvailableAmountByGroup({ month, year, group }) {
  const activeRule = await budgetRuleRepository.createDefaultIfNotExists();

  const transactions = await transactionRepository.findAll({
    year,
  });

  const transfers = await budgetGroupTransferRepository.findByYear(year);

  const monthlySummaries = groupTransactionsByMonthForRollover(transactions);

  const rolloverResult = calculateBudgetRuleRollover({
    monthlySummaries,
    budgetRule: activeRule,
    targetMonth: month,
    transfers,
  });

  const groupResult = rolloverResult.groups.find((item) => {
    return item.group === group;
  });

  return Number(groupResult?.availableCents || 0);
}

async function listBudgetGroupTransfers(filters = {}) {
  const normalizedFilters = normalizeTransferFilters(filters);

  const transfers =
    await budgetGroupTransferRepository.findAll(normalizedFilters);
}

async function createBudgetGroupTransfer(transferData) {
  const month = normalizeMonth(transferData.month);
  const year = normalizeYear(transferData.year);

  const formGroup = normalizeBudgetGroup(
    transferData.fromGroup,
    'O grupo de origem'
  );

  const toGroup = normalizeBudgetGroup(
    transferData.toGroup,
    'O grupo de destino'
  );

  if (fromGroup === toGroup) {
    throw createHttpError(
      'O grupo de origem não pode ser igual ao grupo de destino.'
    );
  }

  const amountCents =
  transferData.amountCents !== undefined
    ? Number(transferData.amountCents)
    : toCents(transferData.amount);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw createHttpError('O valor da transferência deve ser maior que zero.');
  }

  const availableCents = await getAvailableAmountByGroup({
    month,
    year,
    group: fromGroup,
  });

  if (amountCents > availableCents) {
    throw createHttpError(
      'O valor transferido não pode ser maior que o saldo acumulado disponível no grupo de origem.'
    );
  }

  const transfer = await budgetGroupTransferRepository.create({
    month,
    year,
    fromGroup,
    toGroup,
    amountCents,
    description: normalizeDescription(transferData.description),
  });

  return formatTransfer(transfer);
}

async function deleteBudgetGroupTransfer(id) {
  const deletedTransfer = await budgetGroupTransferRepository.deleteById(id);

  if (!deletedTransfer) {
    throw createHttpError('Transferência não encontrada.', 404);
  }

  return formatTransfer(deletedTransfer);
}

module.exports = {
  listBudgetGroupTransfers,
  createBudgetGroupTransfer,
  deleteBudgetGroupTransfer,
};
