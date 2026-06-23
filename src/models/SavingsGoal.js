const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  targetAmount: { type: Number, required: true, min: 0.01 },
  months: { type: Number, required: true, min: 1, max: 600 }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
