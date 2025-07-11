import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { readDb } from '../db.js';

const router = express.Router();

// GET /api/users/me - Get current user's profile
router.get('/me', auth, (req, res) => {
    const db = readDb();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const { passwordHash, securityAnswerHash, ...userResponse } = user;
    res.json(userResponse);
});

// GET /api/users - Get all users (Admin only)
router.get('/', auth, admin, (req, res) => {
    const db = readDb();
    const usersResponse = db.users.map(u => {
        const { passwordHash, securityAnswerHash, ...userResponse } = u;
        return userResponse;
    });
    res.json(usersResponse);
});

export default router;
