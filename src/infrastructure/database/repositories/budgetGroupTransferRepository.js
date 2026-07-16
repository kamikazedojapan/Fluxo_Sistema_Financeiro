const mongoose = require('mongoose');

const { budgetGroupTransfer, BudgetGroupTransfer } = require('../models');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function buildTransferFilters(filters = {}) {
  const query = {};

  if (filters.month) {
    query.month = Number(filters.month);
  }

  if (filters.year) {
    query.year = Number(filters.year);
  }

  if (filters.fromGroup) {
    query.toGroup = filters.fromGroup;
  }

  if (filters.toGroup) {
    query.toGroup = filters.toGroup;
  }

  return query;
}

async function create(transferData) {
  const transfer = await BudgetGroupTransfer.create(transferData);

  return transfer.toObject();
}

async function findAll(filters = {}) {
  const query = buildTransferFilters(filters);

  return BudgetGroupTransfer.find(query)
    .sort({
      year: -1,
      month: -1,
      createdAt: -1,
    })
    .lean();
}

async function findById(id) {
  if (!isValidObjectId) {
    return null;
  }

  return BudgetGroupTransfer.findById(id).lean();
}

async function findByPeriod({ month, year}) {
  return findAll({
    month,
    year,
  });
}

async function findByYear(year) {
  return findAll({
    year,
  });
}

async function deleteById(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  return BudgetGroupTransfer.findByIdAndDelete(id).lean();

}

module.exports = {
  buildTransferFilters,
  create,
  findAll,
  findById,
  findByPeriod,
  findByYear,
  deleteById,
}
