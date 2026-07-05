const { budgetRule } = require('../models');

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
  const total = Number(needsPercent) + Number(wantsPercent) + Number(investmentsPercent);

  if (total !== 100) {
    const error = new Error(
      'A soma dos percentuais da regra financeira deve ser igual a 100%.'
    );

    error.statusCode = 400

    throw error;
  }
}

async function findActive() {
  return BudgetRule.findOne({ active: true }).sort({ updateAt: -1 }).lean();
}

async function createDefaultIfNotExists() {
  const activeRule = await findActive();

  if (activeRule) {
    return activeRule;
  }

  const rule = await BudgetRule.create(DEFAULT_BUDGET_RULE);

  return rule.toObject();
}

async function updateActiveRule(ruleData) {
  validateBudgetRulePercentages(ruleData);

  const currentRule = await BudgetRule.findOne({ active: true }).sort({
    updateAt: -1,
  });

  if (currentRule) {
    currentRule.set({
      needsPercent: Number(ruleData.needsPercent),
      wantsPercent: Number(ruleData.wantsPercent),
      investmentsPercent: Number(ruleData.investmentsPercent),
      active: true,
    });

    await currentRule.save();

    return currentRule.toObject();
  }

  const newRule = await BudgetRule.create({
    needsPercent: Number(ruleData.needsPercent),
    wantsPercent: Number(ruleData.wantsPercent),
    investmentsPercent: Number(ruleData.investmentsPercent),
    active: true,
  });

  return newRule.toObject();
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