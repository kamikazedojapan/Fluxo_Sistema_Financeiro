const express = require('express');
const {
  listBudgetGroupTransfers,
  createBudgetGroupTransfer,
  deleteBudgetGroupTransfer,
 } = require('../controllers/budgetGroupTransferController');

const router = express.Router();

router.get('/', listBudgetGroupTransfers);
router.post('/', createBudgetGroupTransfer);
router.delete('/:id', deleteBudgetGroupTransfer);

module.exports = router;