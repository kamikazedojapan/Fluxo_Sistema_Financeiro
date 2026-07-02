const Budget = require('../../../models/Budget');

const DAYS_IN_PLAN = 30;

function defaultDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function assertMoney(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${fieldName} deve ser um número maior ou igual a zero.`);
  }
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function toMoney(cents) {
  return Number((cents / 100).toFixed(2));
}

function isValidDateString(value) {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addDays(dateString, offset) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));

  return date.toISOString().slice(0, 10);
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getMessage(balanceCents, nextBalanceCents) {
  const balance = toMoney(balanceCents);

  if (balanceCents > 0) {
    return {
      type: 'positive',
      text: `Hoje você pode gastar até ${formatBRL(balance)}`,
    };
  }

  if (nextBalanceCents > 0) {
    return {
      type: 'warning',
      text: 'Você poderá gastar dinheiro amanhã',
    };
  }

  return {
    type: 'negative',
    text: 'Não é recomendado que você gaste dinheiro hoje',
  };
}

function calculateMonthlyPlan({ monthlyIncome, monthlyExpenses, startDate }) {
  const income = Number(monthlyIncome);
  const expenses = Number(monthlyExpenses);

  assertMoney(income, 'Receita mensal');
  assertMoney(expenses, 'Gastos do mês');

  if (!isValidDateString(startDate)) {
    throw new TypeError('Data inicial inválida.');
  }

  const incomeCents = toCents(income);
  const expensesCents = toCents(expenses);

  const totalRemainingCents = incomeCents - expensesCents;
  const dailyLimitExact = incomeCents / DAYS_IN_PLAN;

  const days = Array.from({ length: DAYS_IN_PLAN }, (_, index) => {
    const plannedRemainingCents = Math.round(
      incomeCents - dailyLimitExact * (index + 1)
    );

    const nextPlannedRemainingCents = Math.round(
      incomeCents - dailyLimitExact * (index + 2)
    );

    const balanceCents = totalRemainingCents - plannedRemainingCents;
    const nextBalanceCents = totalRemainingCents - nextPlannedRemainingCents;

    return {
      day: index + 1,
      date: addDays(startDate, index),
      plannedRemaining: toMoney(plannedRemainingCents),
      dailyBalance: toMoney(balanceCents),
      message: getMessage(balanceCents, nextBalanceCents),
    };
  });

  return {
    monthlyIncome: toMoney(incomeCents),
    monthlyExpenses: toMoney(expensesCents),
    totalRemaining: toMoney(totalRemainingCents),
    dailyLimit: toMoney(Math.round(dailyLimitExact)),
    startDate,
    days,
  };
}

async function getMonthlyPlan(_request, response, next) {
  try {
    const budget = await Budget.findOne().sort({ updatedAt: -1 }).lean();

    const values = budget || {
      monthlyIncome: 0,
      monthlyExpenses: 0,
      startDate: defaultDate(),
    };

    const result = calculateMonthlyPlan({
      monthlyIncome: values.monthlyIncome,
      monthlyExpenses: values.monthlyExpenses,
      startDate: values.startDate || defaultDate(),
    });

    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

async function saveMonthlyPlan(request, response, next) {
  try {
    const monthlyIncome = Number(request.body.monthlyIncome);
    const monthlyExpenses = Number(request.body.monthlyExpenses);
    const startDate = request.body.startDate;

    const result = calculateMonthlyPlan({
      monthlyIncome,
      monthlyExpenses,
      startDate,
    });

    const current = await Budget.findOne().sort({ updatedAt: -1 });

    if (current) {
      current.set({
        monthlyIncome,
        monthlyExpenses,
        startDate,
      });

      await current.save();
    } else {
      await Budget.create({
        monthlyIncome,
        monthlyExpenses,
        startDate,
      });
    }

    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  calculateMonthlyPlan,
  getMonthlyPlan,
  saveMonthlyPlan,
};