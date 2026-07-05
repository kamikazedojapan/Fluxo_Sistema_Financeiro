const mongoose = require('mongoose');

const { Transaction } = require('../models');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function buildTransactionFilters(filters = {}) {
    const query = {};

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.categoryId && isValidObjectId(filters.categoryId)) {
        query.categoryId = filters.categoryId;
    }

    if (filters.categoryName) {
        query.categoryName = filters.categoryName;
    }

    if (filters.budgetGroup) {
        query.budgetGroup = filters.budgetGroup;
    }

    if (filters.isPaid !== undefined) {
        query.isPaid = filters.isPaid === true || filters.isPaid === 'true';
    }

    if (filters.isRecurring !== undefined) {
        query.isRecurring =
					filters.isRecurring === true || filters.isRecurring === 'true';
    }

		if (filters.month && filters.year) {
			const month = String(filters.month).padStart(2, '0');
			const year = String(filters.year);

			query.date = {
				$regex: `^${year}-${month}`,
			};
		} else if (filters.year) {
			const year = String(filters.year);

			query.date = {
				$regex: `^${year}`,
			};
		}
		return query;
}

async function create(transactionData) {
	const transaction = await Transaction.create(transactionData);

	return transaction.toObject();
}

async function findAll(filters = {}) {
	const query = buildTransactionFilters(filters);

	return Transaction.find(query).sort({ date: -1, createdAt: -1 }).lean();
}

async function findById(id) {
	if (!isValidObjectId(id)) {
		return null;
	}

	return Transaction.findById(id).lean();
}

async function updateById(id, transactionData) {
	if (!isValidObjectId(id)) {
		return null;
	}

	return Transaction.findByIdAndUpdate(id, transactionData, {
		new: true,
		runValidators: true,
	}).lean();
}

async function deleteById(id) {
	if (!isValidObjectId(id)) {
		return null;
	}

	return Transaction.findByIdAndDelete(id).lean();
}

async function countByCategoryId(categoryId) {
	if (!isValidObjectId(categoryId)) {
		return 0;
	}

	return Transaction.countDocuments({ categoryId });
}

async function sumByType(type, filters = {}) {
	const query = buildTransactionFilters({
		...filters,
		type,
	});

	const result = await Transaction.aggregate([
		{
			$match: query,
		},
		{
			$group: {
				_id: '$type',
				totalCents: {
					$sum: '$amountCents',
				},
			},
		},
	]);

	return result[0]?.totalCents || 0;
}

async function sumByCategory(filters = {}) {
	const query = buildTransactionFilters(filters);

	return Transaction.aggregate([
		{
			$match: query,
		},
		{
			$group: {
				_id: {
					categoryId: '$categoryId',
					categoryName: '$categoryName',
					type: '$type',
				},
				totalCents: {
					$sum: '$amountCents',
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$sort: {
				totalCents: -1,
			},
		},
	]);
}

async function sumByBudgetGroup(filters = {}) {
	const query = buildTransactionFilters(filters);

	return Transaction.aggregate([
		{
			$match: {
				...query,
				type: 'expense',
			},
		},
		{
			$group: {
				_id: '$budgetGroup',
				totalCents: {
					$sum: '$amountCents',
				},
				count: {
					$sum: 1,
				},
			},
		},
	]);
}

module.exports = {
	create,
	findAll,
	findById,
	updateById,
	deleteById,
	countByCategoryId,
	sumByType,
	sumByCategory,
	sumByBudgetGroup,
};