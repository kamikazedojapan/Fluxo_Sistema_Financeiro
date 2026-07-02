const express = require('express');
const {
    getBudgetRule,
    updateBudgetRule,
} = require('../controllers/budgetRuleController');

const router = express.Router();

router.get('/', getBudgetRule);
router.put('/', updateBudgetRule);

module.exports = router;