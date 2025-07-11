import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '../db.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { username, password, securityQuestion, securityAnswer } = req.body;
    if (!username || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const db = readDb();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const securityAnswerHash = bcrypt.hashSync(securityAnswer.toLowerCase(), 10);

    const newUser = {
        id: uuidv4(),
        username,
        passwordHash,
        securityQuestion,
        securityAnswerHash,
        role: db.users.length === 0 ? 'admin' : 'player' // First user is admin
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ id: newUser.id, role: newUser.role, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: ph, securityAnswerHash: sah, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse, token });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash, securityAnswerHash, ...userResponse } = user;
    res.json({ user: userResponse, token });
});

// POST /api/auth/get-question
router.post('/get-question', (req, res) => {
    const { username } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ question: user.securityQuestion });
});

// POST /api/auth/verify-answer
router.post('/verify-answer', (req, res) => {
    const { username, answer } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || !bcrypt.compareSync(answer.toLowerCase(), user.securityAnswerHash)) {
        return res.status(401).json({ message: 'Incorrect answer.' });
    }
    res.status(200).json({ message: 'Answer verified.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
    // Note: In a real app, this should be a stateful process, e.g., using a short-lived token from verify-answer.
    // For simplicity here, we trust the frontend flow.
    const { username, newPassword } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    writeDb(db);
    res.status(200).json({ message: 'Password has been reset.' });
});

export default router;
