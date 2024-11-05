// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /auth/register
router.get('/register', (req, res) => {
    if (req.session.token) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', { title: 'Register' });
});

// @route   GET /auth/login
router.get('/login', (req, res) => {
    if (req.session.token) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { title: 'Login' });
});

// @route   POST /auth/register
router.post('/register', async(req, res) => {
    try {
        const { username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.render('auth/register', {
                error: 'User already exists',
                username,
                email
            });
        }

        user = new User({
            username,
            email,
            password
        });

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        req.session.token = token;
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err.message);
        res.render('auth/register', {
            error: 'Server error occurred',
            username: req.body.username,
            email: req.body.email
        });
    }
});

// @route   POST /auth/login
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                error: 'Invalid credentials',
                email
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', {
                error: 'Invalid credentials',
                email
            });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        req.session.token = token;
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err.message);
        res.render('auth/login', {
            error: 'Server error occurred',
            email: req.body.email
        });
    }
});

// @route   POST /auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/auth/login');
    });
});

module.exports = router;