const express = require('express');
const { getBudget, saveBudget } = require('../controllers/budgetController');

const router = express.Router();
router.get('/', getBudget);
router.put('/', saveBudget);

module.exports = router;
