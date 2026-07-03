const mongoose = require('mongoose');

const { Schema } = mongoose;

const transactionSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: [true, 'O tipo de transação é obrigatório.'],
        },

        amountCents: {
            type: Number,
            required: [true, 'O valor da transação é obrigatório.'],
            min: [0, 'O valor da transação não pode ser negativo.']
        },

        date: {
            type: String,
            required: [true, 'A data da transação é obrigatória.'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD'],
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            def: 'Category',
            default: null,
        },

        categoryName: {
            type: String,
            required: [true, 'O nome da categoria é obrigatório.'],
            trim: true,
        },

        budgetGroup: {
            type: String,
            enum: ['needs', 'wants', 'investments'],
            required: [true, 'O grupo financeiro é obrigatório.'],
        },

        description: {
            type: String,
            trim: true,
            default: '',
        },

        isRecurring: {
            type: Boolean,
            default: false,
        },

        isPaid: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'transactions',
    }
);

transactionSchema.index({ type: 1});
transactionSchema.index({ date: 1});
transactionSchema.index({ categoryId: 1 });
transactionSchema.index({ budgetGroup: 1 });
transactionSchema.index({ type: 1, date: 1 });

module.exports =
	mongoose.models.Transaction ||
	mongoose.model('Transaction', transactionSchema);