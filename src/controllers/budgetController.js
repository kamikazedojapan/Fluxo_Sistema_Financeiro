const Budget = require('../models/Budget');
const { calculateBudget } = require('../domain/budgetCalculator');

function defaultDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

async function getBudget(_request, response, next) {
  try {
    const budget = await Budget.findOne().sort({ updatedAt: -1 }).lean();
    const values = budget || { monthlyIncome: 0, monthlyExpenses: 0, startDate: defaultDate() };
    response.json(calculateBudget(values));
  } catch (error) {
    next(error);
  }
}

async function saveBudget(request, response, next) {
  try {
    const monthlyIncome = Number(request.body.monthlyIncome);
    const monthlyExpenses = Number(request.body.monthlyExpenses);
    const startDate = request.body.startDate;
    const result = calculateBudget({ monthlyIncome, monthlyExpenses, startDate });

    const current = await Budget.findOne().sort({ updatedAt: -1 });
    if (current) {
      current.set({ monthlyIncome, monthlyExpenses, startDate });
      await current.save();
    } else {
      await Budget.create({ monthlyIncome, monthlyExpenses, startDate });
    }

    response.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getBudget, saveBudget };
