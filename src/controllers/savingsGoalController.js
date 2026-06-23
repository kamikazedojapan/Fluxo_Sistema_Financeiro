const SavingsGoal = require('../models/SavingsGoal');
const { calculateSavingsGoal } = require('../domain/savingsCalculator');

async function getSavingsGoal(_request, response, next) {
  try {
    const goal = await SavingsGoal.findOne().sort({ updatedAt: -1 }).lean();
    response.json(goal ? calculateSavingsGoal(goal) : null);
  } catch (error) {
    next(error);
  }
}

async function saveSavingsGoal(request, response, next) {
  try {
    const targetAmount = Number(request.body.targetAmount);
    const months = Number(request.body.months);
    const result = calculateSavingsGoal({ targetAmount, months });

    const current = await SavingsGoal.findOne().sort({ updatedAt: -1 });
    if (current) {
      current.set({ targetAmount, months });
      await current.save();
    } else {
      await SavingsGoal.create({ targetAmount, months });
    }

    response.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSavingsGoal, saveSavingsGoal };
