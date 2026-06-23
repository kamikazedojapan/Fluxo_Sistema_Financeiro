const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSavingsGoal } = require('../src/domain/savingsCalculator');

test('calcula o valor mensal e fecha a meta sem perder centavos', () => {
  const result = calculateSavingsGoal({ targetAmount: 1000, months: 3 });
  assert.equal(result.monthlyAmount, 333.33);
  assert.equal(result.lastMonthAmount, 333.34);
  assert.equal(result.schedule.length, 3);
  assert.equal(result.schedule[2].accumulated, 1000);
  assert.equal(result.schedule[2].progress, 100);
});

test('valida meta e quantidade de meses', () => {
  assert.throws(() => calculateSavingsGoal({ targetAmount: 0, months: 12 }));
  assert.throws(() => calculateSavingsGoal({ targetAmount: 1000, months: 1.5 }));
});
