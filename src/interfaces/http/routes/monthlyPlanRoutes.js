const express = require('express');

const {
    getMonthlyPlan,
    saveMonthlyPlan,
} = require('../controllers/monthlyPlanController');

const router = express.Router();

router.get('/', getMonthlyPlan);
router.put('/', saveMonthlyPlan);

module.exports = router;