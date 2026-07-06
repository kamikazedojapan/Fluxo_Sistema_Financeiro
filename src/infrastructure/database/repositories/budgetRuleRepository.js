const { BudgetRule } = require('../models');

const DEFAULT_BUDGET_RULE = {
  needsPercent: 50,
  wantsPercent: 30,
  investmentsPercent: 20,
  active: true,
};

function validateBudgetRulePercentages({
  needsPercent,
  wantsPercent,
  investmentsPercent,
}) {
  const total =
    Number(needsPercent) + Number(wantsPercent) + Number(investmentsPercent);

  if (total !== 100) {
    const error = new Error(
      'A soma dos percentuais da regra financeira deve ser igual a 100%.'
    );

    error.statusCode = 400;

    throw error;
  }
}

async function findActive() {
  return BudgetRule.findOne({ active: true }).sort({ updatedAt: -1 }).lean();
}

async function createDefaultIfNotExists() {
  const activeBudgetRule = await findActive();

  if (activeBudgetRule) {
    return activeBudgetRule;
  }

  const createdBudgetRule = await BudgetRule.create(DEFAULT_BUDGET_RULE);

  return createdBudgetRule.toObject();
}

async function updateActiveRule(ruleData) {
  validateBudgetRulePercentages(ruleData);

  const currentBudgetRule = await BudgetRule.findOne({ active: true }).sort({
    updatedAt: -1,
  });

  if (currentBudgetRule) {
    currentBudgetRule.set({
      needsPercent: Number(ruleData.needsPercent),
      wantsPercent: Number(ruleData.wantsPercent),
      investmentsPercent: Number(ruleData.investmentsPercent),
      active: true,
    });

    await currentBudgetRule.save();

    return currentBudgetRule.toObject();
  }

  const createdBudgetRule = await BudgetRule.create({
    needsPercent: Number(ruleData.needsPercent),
    wantsPercent: Number(ruleData.wantsPercent),
    investmentsPercent: Number(ruleData.investmentsPercent),
    active: true,
  });

  return createdBudgetRule.toObject();
}

async function deactivateAll() {
  return BudgetRule.updateMany(
    {
      active: true,
    },
    {
      active: false,
    }
  );
}

module.exports = {
  DEFAULT_BUDGET_RULE,
  validateBudgetRulePercentages,
  findActive,
  createDefaultIfNotExists,
  updateActiveRule,
  deactivateAll,
};