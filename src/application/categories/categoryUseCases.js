const {
    categoryRepository,
} = require('../../infrastructure/database/repositories');

const DEFAULT_CATEGORIES = [
    {
        name: 'Salário',
        type: 'income',
        isDefault: true,
    },
    {
        name: 'Pix',
        type: 'income',
        isDefault: true,
    },
    {
        name: 'Crédito',
        type: 'income',
        isDefault: true,
    },
    {
        name: 'Investimentos',
        type: 'income',
        isDefault: true,
    },
    {
        name: 'Outros',
        type: 'income',
        isDefault: true,
    },
    {
        name: 'Alimentação',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Mercado',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Compras',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Transporte',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Moradia',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Energia',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Internet',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Saúde',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Educação',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Livros',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Lazer',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Assinaturas em Apps',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Desejos',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Investimentos',
        type: 'expense',
        isDefault: true,
    },
    {
        name: 'Outros',
        type: 'expense',
        isDefault: true,
    },
];

function normalizeCategoryType(type) {
    if (!['income', 'expense'].includes(type)) {
        const error = new TypeError(
            'O tipo da categoria deve ser income ou expense.'
        );
        error.statusCode = 400;
        throw error;
    }
    return type;
}

function normalizeCategoryName(name) {
    if (typeof name !== 'string') {
        const error = new TypeError('O nome da categoria é obrigatório.');
        error.statusCode = 400;
        throw error;
    }
    const normalizedNamed = name.trim();

    if (!normalizedNamed) {
        const error = new TypeError('O nome da categoria é obrigatório.');
        error.statusCode = 400;
        throw error;
    }

    if (normalizedNamed.length > 60) {
        const error = new TypeError(
            'O nome da categoria deve ter no máximo 60 caracteres.'
        );
        error.statusCode = 400;
        throw error;
    }

    return normalizedNamed;
}

async function ensureDefaultCategories() {
    return categoryRepository.createManyIfNotExists(DEFAULT_CATEGORIES);
}

async function listCategories(filters = {}) {
    await ensureDefaultCategories();
    const normalizedFilters = {};

    if (filters.type) {
        normalizedFilters.type = normalizeCategoryType(filters.type);
    }

    return categoryRepository.findAll(normalizedFilters);
}

async function createCategory(categoryData) {
    const name = normalizeCategoryName(categoryData.name);
    const type = normalizeCategoryType(categoryData.type);

    const existingCategory = await categoryRepository.findByNameAndType(
        name,
        type
    );

    if (existingCategory) {
        const error = new Error('Já existe uma categoria com esse nome e tipo.');
        error.statusCode = 400;
        throw error;
    }

    return categoryRepository.create({
        name,
        type,
        isDefault: false,
    });
}

async function deleteCategory(categoryId) {
    const deletedCategory = await categoryRepository.deleteById(categoryId);

    if (!deletedCategory) {
        const error = new Error('Categoria não encontrada.');
        error.statusCode = 400;
        throw error;
    }

    return deletedCategory;
}

module.exports = {
    DEFAULT_CATEGORIES,
    ensureDefaultCategories,
    listCategories,
    createCategory,
    deleteCategory,
};