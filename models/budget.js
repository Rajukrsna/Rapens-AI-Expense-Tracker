const mongoose = require('mongoose');

// Budget Schema
const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User
  income: { type: Number, required: true },
  categories: [
    {
      name: String,
      limit: Number, // Budget limit for the category
      priority: Number,
      spent: { type: Number, default: 0 }, // Amount spent in the category
    },
  ],
  dailySpending: [
    {
      date: { type: Date, default: Date.now }, // Date of the spending
      amount: { type: Number, required: true }, // Spending amount
    },
  ],
  fixedIncome:{ type: Number, required:true },
});

module.exports = mongoose.model('Budget', budgetSchema);
