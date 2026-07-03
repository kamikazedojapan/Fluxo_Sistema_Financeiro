const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema(
	{
		name: {
        type: String,
        required: [ true, 'O nome da categoria é obrigatório.'],
        trim: true,
    },

		type: {
			type: String,
			enum: ['income', 'expense'],
			required: [true, 'O tipo de categoria é obrigatório.'],
		},

		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamp: true,
		collection: 'categories',
	}
);

categorySchema.index({ type: 1});
categorySchema.index({ name: 1, type: 1}, { unique: true });

module.exports = mongoose.models.Category ||
mongoose.model('Category', categorySchema);