const DAYS_IN_PLAN = 30;

function assertMoney(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${fieldName} deve ser um número maior ou igual a zero.`);
  }
}

function toCents(value) {
  return Math.round(value * 100);
}

function toMoney(cents) {
  return Number((cents / 100).toFixed(2));
}

function addDays(dateString, offset) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function getMessage(balanceCents, nextBalanceCents) {
  if (balanceCents > 0) {
    return { type: 'positive', text: `Hoje você pode gastar até ${toMoney(balanceCents)}` };
  }

  if (nextBalanceCents > 0) {
    return { type: 'warning', text: 'Você poderá gastar dinheiro amanhã' };
  }

  return { type: 'negative', text: 'Não é recomendado que você gaste dinheiro hoje' };
}

function calculateBudget({ monthlyIncome, monthlyExpenses, startDate }) {
  assertMoney(monthlyIncome, 'Receita mensal');
  assertMoney(monthlyExpenses, 'Gastos do mês');
  if (!isValidDateString(startDate)) {
    throw new TypeError('Data inicial inválida.');
  }

  const incomeCents = toCents(monthlyIncome);
  const expensesCents = toCents(monthlyExpenses);
  const totalRemainingCents = incomeCents - expensesCents;
  const dailyLimitExact = incomeCents / DAYS_IN_PLAN;

  const days = Array.from({ length: DAYS_IN_PLAN }, (_, index) => {
    const plannedRemainingCents = Math.round(incomeCents - dailyLimitExact * (index + 1));
    const nextPlannedCents = Math.round(incomeCents - dailyLimitExact * (index + 2));
    const balanceCents = totalRemainingCents - plannedRemainingCents;
    const nextBalanceCents = totalRemainingCents - nextPlannedCents;

    return {
      day: index + 1,
      date: addDays(startDate, index),
      plannedRemaining: toMoney(plannedRemainingCents),
      dailyBalance: toMoney(balanceCents),
      message: getMessage(balanceCents, nextBalanceCents)
    };
  });

  return {
    monthlyIncome: toMoney(incomeCents),
    monthlyExpenses: toMoney(expensesCents),
    totalRemaining: toMoney(totalRemainingCents),
    dailyLimit: toMoney(Math.round(dailyLimitExact)),
    startDate,
    days
  };
}

module.exports = { calculateBudget, DAYS_IN_PLAN };
