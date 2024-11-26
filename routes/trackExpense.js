/**
 * Track spending in a category
 * Input: Category name and amount spent
 */
const express = require('express');
const Budget = require('../models/budget');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');

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



router.get('/', (req,res)=>
{
  res.render('setup.ejs');
})

router.get('/trackExp', async (req, res) => {
  try {
    // Fetch the budget data
    const budget = await Budget.findOne();

    if (!budget) {
      return res.status(404).send('Budget not found');
    }

    // Render the `trackExpense` view, passing the categories to the EJS template
    res.render('trackExpense', { categories: budget.categories });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.post('/spend', authenticateToken, async (req, res) => {
  const { category, amount } = req.body;
  const userId = req.user.id;

  // Validate input
  const parsedAmount = Number(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  try {
    // Find the budget document
    const budget = await Budget.findOne({ userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Find the target category
    let targetCategory = budget.categories.find(c => c.name === category);
    if (!targetCategory) {

      
        targetCategory = { name: category, priority: 1, limit: 0, spent:parsedAmount };
        budget.categories.push(targetCategory);
       
        // Get predicted budget distribution
      const predictedBudgets = await predictions(budget.income,budget.categories);
  
        // Update each category's limit using the predicted budgets
      predictedBudgets.forEach(predicted => {
        const categoryToUpdate = budget.categories.find(c => c.name === predicted.name);
        console.log(predicted)
        if (categoryToUpdate) {
          categoryToUpdate.limit = parseFloat(predicted.predictedAmount); // Ensure it's a number
        }})
      // Save the updated budget
  budget.markModified('categories');
  await budget.save();
    }
  
else{
    // Update the spent amount
    targetCategory.spent += parsedAmount;
}
  // Get the current date in "YYYY-MM-DD" format
  const currentDate = new Date().toISOString().split('T')[0];

  // Check if an entry for the current date already exists in dailySpending
  const existingEntry = budget.dailySpending.find(entry => {
    const entryDate = new Date(entry.date).toISOString().split('T')[0];
    return entryDate === currentDate;
  });

  if (existingEntry) {
    // Update the amount for the existing entry
    existingEntry.amount += parsedAmount;
  } else {
    // Add a new entry for today's date
    budget.dailySpending.push({
      date: new Date(),
      amount: parsedAmount,
    });
  }
    // Mark the categories field as modified and save
    budget.markModified('dailySpending');
    budget.markModified('categories');
    await budget.save();

    console.log('Updated Budget:', budget);
    res.redirect('/dashboard/dashboard');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error updating spending', error: error.message });
  }
});

module.exports=router;