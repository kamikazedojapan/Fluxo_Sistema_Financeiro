const mongoose = require('mongoose');

const { Schema } = mongoose;

const VALID_BUDGET_GROUPS = ['needs', 'wants', 'investments'];

const budgetGroupTransferSchema = new Schema(
  {
    month: {
      type: Number,
      required: [true, 'O mês da transferência é obrigatório.'],
      min: [1, 'O mês deve ser entre 1 e 12.'],
      max: [12, 'O mês deve ser entre 1 e 12.'],
    },

    year: {
      type: Number,
      required: [true, 'O ano da transferencia é obrigatório.'],
      min: [1900, 'O ano informado é inválido.'],
      min: [3000, 'O ano informado é inválido.'],
    },

    fromGroup: {
      type: String,
      enum: VALID_BUDGET_GROUPS,
      required: [true, 'O grupo de origem é obrigatório.'],
    },

    toGroup: {
      type: String,
      enum: VALID_BUDGET_GROUPS,
      required: [true, 'O grupo de destino é obrigatório.'],
    },

    amountCents: {
      type: Number,
      required: [true, 'O valor da transferência é obrigatório.'],
      min: [1, 'O valor da transferência deve ser maior do que zero.'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'budgetGroupTransfers',
  }
);

budgetGroupTransferSchema.pre('validate', function validateTransfer(next) {
  if (this.fromGroup === this.toGroup) {
    const error = new Error(
      'O grupo de origem não pode ser igual ao grupo de destino.'
    );

    error.statusCode = 400;

    return next(error);
  }

  return next();
});

budgetGroupTransferSchema.index({ year: 1, month: 1});
budgetGroupTransferSchema.index({ fromGroup: 1});
budgetGroupTransferSchema.index({ toGroup: 1});
budgetGroupTransferSchema.index({ year: 1, month: 1, fromGroup: 1, toGroup: 1});

module.exports =
  mongoose.models.budgetGroupTransfer ||
  mongoose.model('BudgetGroupTransfer', budgetGroupTransferSchema);