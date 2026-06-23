const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBudget } = require('../src/domain/budgetCalculator');

test('reproduz os valores e as mensagens da planilha enviada', () => {
  const result = calculateBudget({ monthlyIncome: 1490.10, monthlyExpenses: 257.75, startDate: '2026-06-22' });
  assert.equal(result.totalRemaining, 1232.35);
  assert.equal(result.dailyLimit, 49.67);
  assert.equal(result.days[0].plannedRemaining, 1440.43);
  assert.equal(result.days[0].dailyBalance, -208.08);
  assert.equal(result.days[0].message.type, 'negative');
  assert.equal(result.days[4].dailyBalance, -9.40);
  assert.equal(result.days[4].message.type, 'warning');
  assert.equal(result.days[5].dailyBalance, 40.27);
  assert.equal(result.days[5].message.type, 'positive');
  assert.equal(result.days[29].plannedRemaining, 0);
});

test('rejeita valores negativos e datas inválidas', () => {
  assert.throws(() => calculateBudget({ monthlyIncome: -1, monthlyExpenses: 0, startDate: '2026-06-22' }));
  assert.throws(() => calculateBudget({ monthlyIncome: 100, monthlyExpenses: 0, startDate: '2026-02-31' }));
});
