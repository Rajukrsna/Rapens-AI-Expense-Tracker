const express = require('express');
const path = require('path');
const app = express();
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./middlewares/auth');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();
app.use(cookieParser());

// Log JWT_SECRET to verify it is set correctly (for debugging)
console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`);

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware
app.use(expressLayouts);

// Layout setup for EJS
app.set('layout', 'layout'); // Ensure you have the 'layout.ejs' in the views folder

// Database connection
mongoose.connect(process.env.MONGO_URI, {
   
    serverSelectionTimeoutMS: 5000,  // Set a longer timeout if needed
    socketTimeoutMS: 45000,          // Set a socket timeout for long queries
  })
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));
  
// Routes
app.use('/trackExpense', require('./routes/trackExpense')); // Protect activity routes
app.use('/dashboard', authenticateToken, require('./routes/dashboard')); // Apply auth middleware for protected routes
app.use('/aiBudgePrediction', require('./routes/aiBudgePrediction'));
app.use('/userAuth', require('./routes/userAuth'));
app.use('/ocrDedect', require('./routes/ocrDedect'));
// Root route
app.get('/', (req, res) => res.redirect('/userAuth/login'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
