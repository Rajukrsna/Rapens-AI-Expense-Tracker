const crypto = require('crypto');

// Generate a 256-bit (32-byte) secret key
const secret = crypto.randomBytes(32).toString('hex');
console.log('JWT Secret:', secret);
