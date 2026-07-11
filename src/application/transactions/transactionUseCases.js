const {
  transactionRepository,
  categoryRepository,
} = require('../../infrastructure/database/repositories');

const VALID_TYPES = ['income', 'expense'];
const VALID_BUDGET_GROUPS = ['needs', 'wants', 'investments'];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toCents(value, fieldName = 'Valor') {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw createHttpError(`${fieldName} deve ser um número válido.`)
  }

  if (number < 0) {
    throw createHttpError(`${fieldName} não pode ser negativo.`);
  }

  return Math.round(number * 100);
}

function centsToMoney(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2))
}

function normalizeType(type) {
  if (!VALID_TYPES.includes(type)) {
    throw createHttpError('O tipo da transação deve ser income ou expense.');
  }

  return type;
}

function normalizeBudgetGroup(type, budgetGroup) {
  if (type === 'income') {
    return budgetGroup || null;
  }

  if (!VALID_BUDGET_GROUPS.includes(budgetGroup)) {
    throw createHttpError(
      'O grupo financeiro da despesa deve ser needs, wants ou investments.'
    );
  }

  return budgetGroup
}

function normalizeDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createHttpError('A data deve estar no formato YYYY-MM-DD');
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  const isvalidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isvalidDate) {
    throw createHttpError('A data informada é invalida.');
  }

  return date;
}

function normalizeBoolean(value) {
  return value === true || value === 'true';
}

function normalizeDescription(description) {
  if (description === undefined || description === null) {
    return '';
  }

  return String(description).trim();
}

function normalizeCategoryName(categoryName) {
  if (typeof categoryName !== 'string' || !categoryName.trim()) {
    throw createHttpError('A categoria é obrigatória.');
  }

  return categoryName.trim();
}

async function resolveCategory({ categoryId, categoryName, type}) {
  if (categoryId) {
    const category = await categoryRepository.findById(category);

    if (!category) {
      throw createHttpError(
        'A categoria informada não pertence ao tipo da transação.'
      );
    }

    return {
      categoryId: category._id,
      categoryName: category.name,
    };
  }

  return {
    categoryId: null,
    categoryName: normalizeCategoryName(categoryName),
  };
}

function formatTransaction(transaction) {
  if (!transaction) return null;

  return {
    id: transaction._id?.toString(),
    type: transaction.type,
    amountCents: transaction.amountCents,
    amount: centsToMoney(transaction.amountCents),
    date: transaction.date,
    categoryId: transaction.categoryId?.toString() || null,
    categoryName: transaction.categoryName,
    budgetGroup: transaction.budgetGroup || null,
    description: transaction.description || '',
    isRecurring: Boolean(transaction.isRecurring),
    isPaid: Boolean(transaction.isPaid),
    createdAt: transaction.createdAt,
    updateAt: transaction.updateAt,
  };
}

async function listTransactions(filters = []) {
  const transactions = await transactionRepository.findAll(filters);

  return transactions.map(formatTransaction);
}

async function getTransactionById(id) {
  const transaction = await transactionRepository.findById(id);

  if (!transaction) {
      throw createHttpError('Transação não encontrada.', 404);
  }

  return formatTransaction(transaction);
}

async function createTransaction(transactionData) {
  const type = normalizeType(transactionData.type);

  const category = await resolveCategory({
    categoryId: transactionData.categoryId,
    categoryName: transactionData.categoryName,
    type,
  });

  const transaction = await transactionRepository.create({
    type,
    amountCents:
      transactionData.amountCents !== undefined
        ? Number(transactionData.amountCents)
        : toCents(transactionData.amount, 'Valor da transação'),
    date: normalizeDate(transactionData.date),
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    budgetGroup: normalizeBudgetGroup(type, transactionData.budgetGroup),
    description: normalizeDescription(transactionData.description),
    isRecurring: normalizeDescription(transactionData.isRecurring),
    isPaid: normalizeBoolean(transactionData.isPaid),
  });

  return formatTransaction(transaction);
}

async function updateTransaction(id, transactionData) {
  const currentTransaction = await transactionRepository.findById(id);

  if (!currentTransaction) {
    throw createHttpError('Transação não encontrada.', 404);
  }

  const type = transactionData.type
    ? normalizeType(transactionData.type)
    : currentTransaction.type;

  const category = await resolveCategory({
    categoryId:
      transactionData.categoryId !== undefined
        ? transactionData.categoryId
        : currentTransaction.categoryId,
    categoryName:
      transactionData.categoryName !== undefined
        ? transactionData.categoryName
        : currentTransaction.categoryName,
    type,
  });

  const amountCents =
    transactionData.amountCents !== undefined
      ? Number(transactionData.amountCents)
      : transactionData.amount !== undefined
        ? toCents(transactionData.amount, 'Valor da transação')
        : currentTransaction.amountCents;

  const updatedTransaction = await transactionRepository.updateById(id, {
    type,
    amountCents,
    date:
      transactionData.date !== undefined
        ? normalizeDate(transactionData.date)
        : currentTransaction.date,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      budgetGroup: normalizeBudgetGroup(
        type,
        transactionData.budgetGroup !== undefined
          ? transactionData.budgetGroup
          : currentTransaction.budgetGroup
      ),
      description:
        transactionData.description !== undefined
          ? normalizeDescription(transactionData.description)
          : currentTransaction.description,
      isRecurring:
        transactionData.isRecurring !== undefined
          ? normalizeBoolean(transactionData.isRecurring)
          : currentTransaction.isRecurring,
      isPaid:
        transactionData.isPaid !== undefined
          ? normalizeBoolean(transactionData.isPaid)
          : currentTransaction.isPaid,
  });

  return formatTransaction(updatedTransaction);
}

async function deleteTransaction(id) {
  const deletedTransaction = await transactionRepository.deleteById(id);

  if (!deletedTransaction) {
    throw createHttpError('Transação não encontrada.', 404);
  }

  return formatTransaction(deleteTransaction);
}

module.exports = {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};