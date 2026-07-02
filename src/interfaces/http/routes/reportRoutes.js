const express = require('express');
const {
    getSummaryReport,
    getCategoryReport,
    getCashFlowReport,
    getBudgetRuleReport,
    getMonthlyEvolutionReport,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/summary', getSummaryReport);
router.get('/by-category', getCategoryReport);
router.get('/cash-flow', getCashFlowReport);
router.get('/budget-rule', getBudgetRuleReport);
router.get('/monthly-evolution', getMonthlyEvolutionReport);

module.exports = router;