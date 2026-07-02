const express = require('express');

const {
    listTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/', listTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;