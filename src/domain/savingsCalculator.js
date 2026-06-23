function calculateSavingsGoal({ targetAmount, months }) {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new TypeError('O valor da meta deve ser maior que zero.');
  }
  if (!Number.isInteger(months) || months < 1 || months > 600) {
    throw new TypeError('A quantidade de meses deve ser um número inteiro entre 1 e 600.');
  }

  const targetCents = Math.round(targetAmount * 100);
  const baseMonthlyCents = Math.floor(targetCents / months);
  const remainderCents = targetCents - (baseMonthlyCents * months);

  const schedule = Array.from({ length: months }, (_, index) => {
    const contributionCents = baseMonthlyCents + (index === months - 1 ? remainderCents : 0);
    const accumulatedBeforeLast = baseMonthlyCents * Math.min(index + 1, months - 1);
    const accumulatedCents = index === months - 1 ? targetCents : accumulatedBeforeLast;

    return {
      month: index + 1,
      contribution: Number((contributionCents / 100).toFixed(2)),
      accumulated: Number((accumulatedCents / 100).toFixed(2)),
      progress: Number(((accumulatedCents / targetCents) * 100).toFixed(1))
    };
  });

  return {
    targetAmount: Number((targetCents / 100).toFixed(2)),
    months,
    monthlyAmount: Number((baseMonthlyCents / 100).toFixed(2)),
    lastMonthAmount: Number(((baseMonthlyCents + remainderCents) / 100).toFixed(2)),
    schedule
  };
}

module.exports = { calculateSavingsGoal };
