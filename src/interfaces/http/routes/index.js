const express = require('express');

const { databaseMiddleware } = require('../../../config/database');

const healthRoutes = require('./healthRoutes');
const monthlyPlanRoutes = require('./monthlyPlanRoutes');
const savingsGoalRoutes = require('./savingsGoalRoutes');
const transactionRoutes = require('./transactionRoutes');
const categoryRoutes = require('./categoryRoutes');
const budgetRuleRoutes = require('./budgetRuleRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/monthly-plan', databaseMiddleware, monthlyPlanRoutes);
router.use('/savings-goal', databaseMiddleware, savingsGoalRoutes);
router.use('/transactions', databaseMiddleware, transactionRoutes);
router.use('/categories', databaseMiddleware, categoryRoutes);
router.use('/budget-rule', databaseMiddleware, budgetRuleRoutes);
router.use('/reports', databaseMiddleware, reportRoutes);

// Compatibilidade temporária com a rota antiga do Fluxo
router.use('/budget', databaseMiddleware, monthlyPlanRoutes);

module.exports = router;