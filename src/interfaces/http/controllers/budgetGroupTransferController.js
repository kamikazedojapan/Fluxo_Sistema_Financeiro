const {
  listBudgetGroupTransfers,
  createBudgetGroupTransfer,
  deleteBudgetGroupTransfer,
} = require('../../../application/budgetGroupTransfers/budgetGroupTransferUseCases');

async function handleListBudgetGroupTransfer(request, response, next) {
  try {
    const transfers = await listBudgetGroupTransfers

    return response.json(transfers);
  } catch(error) {
    return next(error);
  }
}

async function handleCreateBudgetGroupTransfer(request, response, next) {
  try {
    const transfer = await createBudgetGroupTransfer(request.body);

    return response.status(201).json(transfer);
  } catch(error) {
    return next(error);
  }
}

async function handleDeleteBudgetGroupTransfer(request, response, next) {
  try {
    const transfer = await deleteBudgetGroupTransfer(request.params.id);

    return response.json({
      message: 'Transferencia excluída com sucesso.',
      transfer,
    });
  } catch(error) {
    return next(error);
  }
}

module.exports = {
  listBudgetGroupTransfers: handleListBudgetGroupTransfer,
  createBudgetGroupTransfer: handleCreateBudgetGroupTransfer,
  deleteBudgetGroupTransfer: handleDeleteBudgetGroupTransfer,
}