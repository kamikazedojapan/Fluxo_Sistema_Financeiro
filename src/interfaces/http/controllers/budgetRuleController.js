const {
    getActiveBudgetRule,
    updateActiveBudgetRule,
} = require('../../../application/budgetRule/budgetRuleUseCases');

async function handleGetBudgetRule(_request, response, next) {
    try {
        const rule = await getActiveBudgetRule();
        return response.json(rule)
    } catch (error) {
        return next(error);
    }
}

async function handleUpdateBudgetRule(request, response, next) {
    try {
        const rule = await updateActiveBudgetRule(request.body);
        return response.json(rule);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getBudgetRule: handleGetBudgetRule,
    updateBudgetRule: handleUpdateBudgetRule,
};