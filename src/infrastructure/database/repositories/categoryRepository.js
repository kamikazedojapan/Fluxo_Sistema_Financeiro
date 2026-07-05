const mongoose = require('mongoose');

const { Category } = require('../models');
const transactionRepository = require('./transactionRepository');

function isValidObjectId(id) {
	return mongoose.Types.ObjectId.isValid(id);
}

async function create(categoryData) {
	const category = await Category.create(categoryData);
	return category.toObject();
}

async function findAll(filters = {}) {
	const query = {};

	if (filters.type) {
		query.type = filters.type;
	}

	return Category.find(query).sort({ type: 1, name: 1}).lean();
}

async function findById(id) {
    if(!isValidObjectId(id)) {
			return null;
    }

    return Category.findById(id).lean();
}

async function findByNameAndType(name, type) {
    return Category.findOne({
			name,
			type,
	}).lean();
}

async function deleteById(id) {
    if (!isValidObjectId(id)) {
			return null;
    }

    const category = await Category.findById(id);

    if (!category) {
			return null
    }

    if (category.isDefault) {
			const error = new Error('Categorias padrão não podem ser excluídas.');
			error.statusCode = 400;
			throw error;
    }

    const transactionUsingCategory =
			await transactionRepository.countByCategoryId(id);

		if (transactionUsingCategory > 0) {
			const error = new Error(
				'Não é possível excluir uma categoria que está vinculada a transações.'
			);
			error.statusCode = 400;
			throw error;
		}

		await category.deleteOne();

		return category.toObject();
}

async function createManyIfNotExists(categories = []) {
	const createdCategories = [];

	for (const categoryData of categories) {
		const existingCategory = await findByNameAndType(
			categoryData.name,
			categoryData.type
		);

		if (!existingCategory) {
			const category = await create(categoryData);
			createdCategories.push(category);
		}
	}

	return createdCategories;
}

module.exports = {
	create,
	findAll,
	findById,
	findByNameAndType,
	deleteById,
	createManyIfNotExists,
};