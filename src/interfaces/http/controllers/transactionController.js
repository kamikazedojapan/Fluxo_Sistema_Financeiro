const {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../../../application/transactions/transactionUseCases')

async function handleListTransaction(request, response, next) {
  try {
    const transactions = await listTransactions(request.query);

    return response.json(transactions);
  } catch (error) {
    return next(error);
  }
}

async function handleGetTransactionById(request, response, next) {
  try {
    const transaction = await getTransactionById(request.params.id);

    return response.json(transaction);
  } catch (error) {
    return next(error);
  }
}

async function handleCreateTransaction(request, response, next) {
  try {
    const transaction = await createTransaction(request.body);

    return response.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
}

async function handleUpdateTransaction(request, response, next) {
  try {
    const transaction = await updateTransaction(request.params.id, request.body);

    return response.json(transaction);
  } catch (error) {
    return next(error);
  }
}

async function handleDeleteTransaction(request, response, next) {
  try {
    const transaction = await deleteTransaction(request.params.id)

    return response.json({
      message: 'Transação excluída com sucesso.',
      transaction,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTransactions: handleListTransaction,
  getTransactionById: handleGetTransactionById,
  createTransaction: handleCreateTransaction,
  updateTransaction: handleUpdateTransaction,
  deleteTransaction: handleDeleteTransaction,
};