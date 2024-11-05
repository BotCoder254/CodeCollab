const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// Get collaborations page
router.get('/', auth, async (req, res) => {
    try {
        const collaborations = await Project.find({
            'collaborators.user': req.user.id,
            owner: { $ne: req.user.id }
        })
        .populate('owner', ['username', 'email'])
        .populate('collaborators.user', ['username', 'email'])
        .sort({ updatedAt: -1 });

        res.render('pages/collaborations', {
            title: 'My Collaborations',
            collaborations,
            user: req.user,
            path: '/collaborations'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('pages/error', {
            error: {
                status: 500,
                message: 'Server error'
            }
        });
    }
});

module.exports = router; 