const express = require('express');
const Budget = require('../models/budget');
const router = express.Router();
const User = require('../models/User');
const authenticateToken= require('../middlewares/auth');
const mongoose=require('mongoose');

router.get( '/', authenticateToken, (req,res)=>{
  const userId = req.user.id;
    // Validate userId
  // Ensure req.user contains the authenticated user's information
    res.render('setup', { userId });
})

async function predictions(income, categories) {
  // Assign weights based on priority
  const weightMap = {
    3: 3,
    2: 2,
    1: 1,
  };

  // Calculate total weight
  const totalWeight = categories.reduce(
    (sum, category) => sum + (weightMap[category.priority] || 1),
    0
  );

  // Predict amounts for each category
  return categories.map(category => {
    const weight = weightMap[category.priority] || 1;
    const predictedAmount = (income * weight) / totalWeight;
    return {
      name: category.name,
      priority: category.priority,
      predictedAmount: predictedAmount.toFixed(2), // Round for better readability
    };
  });
}

router.post('/setup-budget',authenticateToken, async (req, res) => {
  console.log('Request Body:', req.body);
  const {  income, categories, fixedCategories } = req.body;
  const userId = req.user.id;

  try {

     // Check if the user exists
     const user = await User.findById(userId);
     if (!user) {
       return res.status(404).json({ message: 'User not found' });
     }

      // Calculate total weight
  const totW = fixedCategories.reduce(
    (sum, category) => sum + (category.amount||0),
    0
  );
     const income2= income-totW;
    // Get predicted budget distribution
    const predictedBudgets = await predictions(income2, categories);

    // Save the predicted budget into the database
    const budget = predictedBudgets.map(predicted => ({
      name: predicted.name,
      priority: predicted.priority,
      limit: predicted.predictedAmount, // Assign AI-predicted limit
      spent: 0,
      // Update as the user tracks their expenses
    }));

    const newBudget = new Budget({ userId,  income, categories: budget,fixedIncome:totW  });
    await newBudget.save();

    res.redirect('/dashboard/dashboard');
  } catch (error) {
    res.status(500).json({ message: 'Error generating budget', error: error.message });
  }
});

module.exports= router;