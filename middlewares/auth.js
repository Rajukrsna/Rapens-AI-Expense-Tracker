const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authenticateToken = (req, res, next) => {
    const token = req.cookies.authToken; // Extract token from cookies
    // Debugging line

    if (!token) {
        return res.status(401).send('Access Denied: No Token Provided');
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = { id: verified.userId }; // Attach user object with 'id'
        next();
    } catch (err) {
        console.error('Invalid Token:', err);
        res.status(403).send('Access Denied: Invalid Token');
    }
};

module.exports = authenticateToken;
