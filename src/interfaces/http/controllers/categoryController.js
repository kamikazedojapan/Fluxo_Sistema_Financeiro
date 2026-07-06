const {
    listCategories,
    createCategory,
    deleteCategory,
} = require('../../../application/categories/categoryUseCases');

async function handleListCategories(request, response, next) {
    try {
        const categories = await listCategories(request.query);
        return response.json(categories);
    } catch (error) {
        return next(error);
    }
}

async function handleCreateCategory(request, response, next) {
    try {
        const category = await createCategory(request.body);
        return response.status(201).json(category)
    } catch (error) {
        return next(error);
    }
}

async function handleDeleteCategory(request, response, next) {
    try {
        const category = await deleteCategory(request.params.id);
        return response.json({
            message: 'Categoria excluída com sucesso.',
            category,
        })
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    listCategories: handleListCategories,
    createCategory: handleCreateCategory,
    deleteCategory: handleDeleteCategory,
}