const express = require('express');
const Budget = require('../models/budget');
const router = express.Router();
const authenticateToken= require('../middlewares/auth')
/**
 * GET route for displaying the dashboard
 * Fetches the user's income, categories, and current spendings
 */

// Function to add daily spending
async function addDailySpending(userId, spendingAmount) {
  const budget = await Budget.findOne({ userId });

  if (budget) {
    budget.dailySpending.push({ amount: spendingAmount });
    await budget.save();
    console.log('Daily spending recorded!');
  } else {
    console.error('Budget not found for the user!');
  }
}







router.get('/dashboard',authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const budget = await Budget.findOne({ userId }); // Assuming single-user setup for simplicity

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }
  
  // Calculate total spent and remaining budget for each category

  let totalSpent2 = budget.categories.reduce((sum, category) => sum + category.spent, 0);

  totalSpent2+=budget.fixedIncome;
  console.log(totalSpent2)
  const remainingBudget = budget.income - totalSpent2;


  const categoryData = budget.categories.map(category => ({
    name: category.name,
    spent: category.spent,
  }));
  // Render the dashboard with all necessary data
  res.render('dashboard', {
    income: budget.income,
    categories: budget.categories,
    totalSpent2,
    remainingBudget,
    categorys:categoryData,
    totalPredicted: 0,
    totalSpent:0,
    dailyData: budget.dailySpending

  });
});

module.exports = router;
