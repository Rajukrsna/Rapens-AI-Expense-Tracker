const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true , unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hash this in production
  budgets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Budget' }], // References to Budget documents
});

module.exports = mongoose.model('User', userSchema);
