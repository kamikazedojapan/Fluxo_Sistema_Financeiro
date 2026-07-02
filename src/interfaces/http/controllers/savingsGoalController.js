const SavingsGoal = require('../../../models/SavingsGoal');

function calculateSavingsGoal({ targetAmount, months }) {
  const parsedTargetAmount = Number(targetAmount);
  const parsedMonths = Number(months);

  if (!Number.isFinite(parsedTargetAmount) || parsedTargetAmount <= 0) {
    throw new TypeError('O valor da meta deve ser maior que zero.');
  }

  if (
    !Number.isInteger(parsedMonths) ||
    parsedMonths < 1 ||
    parsedMonths > 600
  ) {
    throw new TypeError(
      'A quantidade de meses deve ser um número inteiro entre 1 e 600.'
    );
  }

  const targetCents = Math.round(parsedTargetAmount * 100);
  const baseMonthlyCents = Math.floor(targetCents / parsedMonths);
  const remainderCents = targetCents - baseMonthlyCents * parsedMonths;

  const schedule = Array.from({ length: parsedMonths }, (_, index) => {
    const contributionCents =
      baseMonthlyCents + (index === parsedMonths - 1 ? remainderCents : 0);

    const accumulatedCents =
      index === parsedMonths - 1
        ? targetCents
        : baseMonthlyCents * (index + 1);

    return {
      month: index + 1,
      contribution: Number((contributionCents / 100).toFixed(2)),
      accumulated: Number((accumulatedCents / 100).toFixed(2)),
      progress: Number(((accumulatedCents / targetCents) * 100).toFixed(1)),
    };
  });

  return {
    targetAmount: Number((targetCents / 100).toFixed(2)),
    months: parsedMonths,
    monthlyAmount: Number((baseMonthlyCents / 100).toFixed(2)),
    lastMonthAmount: Number(
      ((baseMonthlyCents + remainderCents) / 100).toFixed(2)
    ),
    schedule,
  };
}

async function getSavingsGoal(_request, response, next) {
  try {
    const goal = await SavingsGoal.findOne().sort({ updatedAt: -1 }).lean();

    if (!goal) {
      return response.json(null);
    }

    return response.json(
      calculateSavingsGoal({
        targetAmount: goal.targetAmount,
        months: goal.months,
      })
    );
  } catch (error) {
    return next(error);
  }
}

async function saveSavingsGoal(request, response, next) {
  try {
    const targetAmount = Number(request.body.targetAmount);
    const months = Number(request.body.months);

    const result = calculateSavingsGoal({
      targetAmount,
      months,
    });

    const current = await SavingsGoal.findOne().sort({ updatedAt: -1 });

    if (current) {
      current.set({
        targetAmount,
        months,
      });

      await current.save();
    } else {
      await SavingsGoal.create({
        targetAmount,
        months,
      });
    }

    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  calculateSavingsGoal,
  getSavingsGoal,
  saveSavingsGoal,
};