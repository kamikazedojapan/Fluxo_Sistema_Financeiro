const {
  budgetRuleRepository,
} = require('../../infrastructure/database/repositories');

function toNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    const error = new TypeError(`${fieldName} deve ser um número válido.`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function validatePercentage(value, fieldName) {
  const number = toNumber(value, fieldName);

  if (number < 0 || number > 100) {
    const error = new TypeError(`${fieldName} deve estar entre 0 e 100.`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function formatBudgetRule(budgetRule) {
  return {
    id: budgetRule._id?.toString(),
    needsPercent: budgetRule.needsPercent,
    wantsPercent: budgetRule.wantsPercent,
    investmentsPercent: budgetRule.investmentsPercent,
    active: budgetRule.active,
    groups: [
      {
        key: 'needs',
        label: 'Necessidades/Custos',
        percent: budgetRule.needsPercent,
      },
      {
        key: 'wants',
        label: 'Desejos',
        percent: budgetRule.wantsPercent,
      },
      {
        key: 'investments',
        label: 'Investimentos',
        percent: budgetRule.investmentsPercent,
      },
    ],
    createdAt: budgetRule.createdAt,
    updatedAt: budgetRule.updatedAt,
  };
}

async function getActiveBudgetRule() {
  const activeBudgetRule = await budgetRuleRepository.createDefaultIfNotExists();

  return formatBudgetRule(activeBudgetRule);
}

async function updateActiveBudgetRule(ruleData) {
  const needsPercent = validatePercentage(
    ruleData.needsPercent,
    'Percentual de necessidades'
  );

  const wantsPercent = validatePercentage(
    ruleData.wantsPercent,
    'Percentual de desejos'
  );

  const investmentsPercent = validatePercentage(
    ruleData.investmentsPercent,
    'Percentual de investimentos'
  );

  const updatedBudgetRule = await budgetRuleRepository.updateActiveRule({
    needsPercent,
    wantsPercent,
    investmentsPercent,
  });

  return formatBudgetRule(updatedBudgetRule);
}

module.exports = {
  getActiveBudgetRule,
  updateActiveBudgetRule,
};