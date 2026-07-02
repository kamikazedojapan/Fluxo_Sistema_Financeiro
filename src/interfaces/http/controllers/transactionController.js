const { notImplemented } = require('./notImplementedController');

module.exports = {
    listTransactions: notImplemented('Listagem de receitas e despesas'),
    getTransactionById: notImplemented('Busca de transação por ID'),
    createTransaction: notImplemented('Cadastro de receita ou despesa'),
    updateTransaction: notImplemented('Edição de receita ou despesa'),
    deleteTransaction: notImplemented('Exclusão de receita ou despesa'),
};
