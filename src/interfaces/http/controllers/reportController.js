const {
  getSummaryReport,
  getCategoryReport,
  getCashFlowReport,
  getBudgetRuleReport,
  getMonthlyEvolutionReport,
} = require('../../../application/reports/reportUseCases');

async function handleGetSummaryReport(request, response, next) {
  try {
    const report = await getSummaryReport(request.query);

    return response.json(report)
  } catch (error) {
    return next(error);
  }
}

async function handleGetCategoryReport(request, response, next) {
  try {
    const report = await getCategoryReport(request.query);

    return response.json(report);
  } catch (error) {
    return next(error);
  }
}

async function handleGetCashFlowReport(request, response, next) {
  try {
    const report = await getCashFlowReport(request.query);

    return response.json(report);
  } catch (error) {
    return next(error);
  }
}

async function handleGetBudgetRuleReport(request, response, next) {
  try {
    const report = await getBudgetRuleReport(request.query);

    return response.json(report);
  } catch (error) {
    return next(error);
  }
}

async function handleGetMonthlyEvolutionReport(request, response, next) {
  try {
    const report = await getMonthlyEvolutionReport(request.query);

    return response.json(report);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummaryReport: handleGetSummaryReport,
  getCategoryReport: handleGetCategoryReport,
  getCashFlowReport: handleGetCashFlowReport,
  getBudgetRuleReport: handleGetBudgetRuleReport,
  getMonthlyEvolutionReport: handleGetMonthlyEvolutionReport,
};