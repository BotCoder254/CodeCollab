const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// @route   GET /dashboard
router.get('/', auth, async (req, res) => {
    try {
        // Get user details
        const user = await User.findById(req.user.id).select('-password');
        
        // Get projects
        const projects = await Project.find({
            $or: [
                { owner: req.user.id },
                { 'collaborators.user': req.user.id }
            ]
        })
        .populate('owner', ['username', 'email'])
        .populate('collaborators.user', ['username', 'email'])
        .sort({ updatedAt: -1 });

        res.render('pages/dashboard', {
            title: 'Dashboard',
            user: user,
            projects: projects,
            path: '/dashboard'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', {
            error: {
                status: 500,
                message: 'Error loading dashboard'
            },
            layout: 'layout'
        });
    }
});

module.exports = router; 