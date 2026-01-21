const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/userModel');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        try {
            // Fetch fresh user data to get role and owner_id
            const dbUser = await User.findById(user.id);
            if (!dbUser) return res.status(404).json({ error: 'User not found' });

            // calculate data_owner_id
            // If I am an owner, data_owner_id is my id.
            // If I am a sub-user, data_owner_id is my owner_id.
            const dataOwnerId = dbUser.owner_id || dbUser.id;

            req.user = {
                ...dbUser, // dbUser is already a plain object from mysql2
                data_owner_id: dataOwnerId
            };

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

const requireOwner = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Only Owners/Admins can perform this action.' });
    }
    next();
};

module.exports = { authenticateToken, requireOwner };
