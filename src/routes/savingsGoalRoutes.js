const express = require('express');
const { getSavingsGoal, saveSavingsGoal } = require('../controllers/savingsGoalController');

const router = express.Router();
router.get('/', getSavingsGoal);
router.put('/', saveSavingsGoal);

module.exports = router;
