const express = require('express');
const multer = require('multer'); // For handling file uploads
const Tesseract = require('tesseract.js'); // OCR library
const Budget = require('../models/budget');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });



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
const extractTotalFromOCR = (ocrText) => {
  // Normalize the text for easier parsing
  const lines = ocrText.split('\n').map(line => line.trim().toLowerCase());

  let total = null;

  // Regular expression for matching total-related lines, allowing for flexible formats
  const totalRegex = /(total|amount\s*due|grand\s*total|balance\s*due|amount\s*payable|)[^\d]*[\s$€₹]*([\d,]+(?:\.\d{2})?)/i;

  // Iterate through each line and attempt to find a match
  for (const line of lines) {
      const match = line.match(totalRegex);
      if (match) {
          // If a match is found, process the amount part
          total = parseFloat(match[2].replace(/,/g, '')); // Remove commas and parse as float
          break;
      }
  }

  return total || null; // Return null if no total found
};

  

router.get('/', (req,res)=>{
res.render('DedectLables');
}
)
/**
 * OCR-based bill processing
 */
router.post('/process-bill', authenticateToken, upload.single('bill'), async (req, res) => {
  const userId = req.user.id;

  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Perform OCR on the uploaded file
    const { data } = await Tesseract.recognize(req.file.path, 'eng');
    console.log('OCR Result:', data.text);
  const amount = extractTotalFromOCR(data.text);

    
    if (!amount) {
      return res.status(400).json({ message: 'Unable to detect bill amount' });
    }
+
    console.log('Extracted Amount:', amount);

    // Match category keywords
    const categories = {
      food: ['grocery', 'supermarket', 'food','groceries','restaurant'],
      entertainment: ['movie', 'cinema', 'entertainment'],
      fuel: ['fuel', 'petrol', 'diesel', 'gas'],
      utilities: ['electricity', 'water', 'utility', 'bill'],
      study:['books', 'note', 'stationary']
    };

    let detectedCategory = 'others'; // Default category
    Object.entries(categories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (data.text.toLowerCase().includes(keyword)) {
          detectedCategory = category;
        }
      });
    });

    console.log('Detected Category:', detectedCategory);

    // Find and update the user's budget
    const budget = await Budget.findOne({ userId });
    if (!budget) {
      return res.status(404).json({ message: 'User budget not found' });
    }

    // Find or create the category
    let targetCategory = budget.categories.find(c => c.name === detectedCategory);
    if (!targetCategory) {
      targetCategory = { name: detectedCategory, priority: 1, limit: 0, spent: 0 };
      budget.categories.push(targetCategory);
      targetCategory.spent += amount;
      // Get predicted budget distribution
    const predictedBudgets = await predictions(budget.income,budget.categories);

      // Update each category's limit using the predicted budgets
    predictedBudgets.forEach(predicted => {
      const categoryToUpdate = budget.categories.find(c => c.name === predicted.name);
      console.log(predicted)
      if (categoryToUpdate) {
        categoryToUpdate.limit = parseFloat(predicted.predictedAmount); // Ensure it's a number
      }
    });
  }


    // Update spending
  

    // Save the updated budget
    budget.markModified('categories');
    await budget.save();

    res.render('DedectLables',{
      message: 'Bill processed successfully',
      extractedAmount: amount,
      category: targetCategory.name
    });
  } catch (error) {
    console.error('Error processing bill:', error);
    res.status(500).json({ message: 'Error processing bill', error: error.message });
  }
});

module.exports = router;
