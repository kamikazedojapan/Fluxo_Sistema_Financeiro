const mongoose = require('mongoose');

const { Schema } = mongoose;

const budgetRuleSchema = new Schema(
	{
		needsPercent: {
			type: Number,
			required: [true, 'O percentual de necessidades é obrigatório.'],
			min: [0, 'O percentual não pode ser negativo.'],
			max: [100, 'O percentual não pode ser maior do que 100.'],
			default: 50,
		},

		wantsPercent: {
			type: Number,
			required: [true, 'O percentual de desejos é obrigatório.'],
			min: [0, 'O percentual não pode ser negativo.'],
			max: [100, 'O percentual não pode ser maior que 100.'],
			default: 30,
		},

		investmentsPercent: {
			type: Number,
			required: [true, 'O percentual de investimentos é obrigatório.'],
			min: [0, 'O percentual não pode ser negativo.'],
			max: [100, 'O percentual não pode ser maior do que 100.'],
			default: 20,
		},

		active: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamp: true,
		collection: 'budgetRules',
	}
);

budgetRuleSchema.pre('validate', function validatePercentages(next) {
	const total = Number(this.needsPercent) + Number(this.wantsPercent) + Number(this.investmentsPercent);

	if (total !== 100) {
		return next(
			new Error('A soma dos percentuais da regra financeira deve ser igual a 100%.')
		);
	}

	return next();
});
budgetRuleSchema.index({ active: 1 });

module.exports =
	mongoose.models.BudgetRule ||
	mongoose.model('BudgetRule', budgetRuleSchema);