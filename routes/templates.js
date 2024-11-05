const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Template = require('../models/Template');
const Project = require('../models/Project');

// Get all templates
router.get('/', auth, async (req, res) => {
    try {
        const templates = await Template.find({
            $or: [
                { owner: req.user.id },
                { isPublic: true }
            ]
        })
        .populate('owner', ['username', 'email'])
        .sort({ createdAt: -1 });

        res.render('pages/templates', {
            title: 'Templates',
            user: req.user,
            templates,
            path: '/templates'
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('pages/error', {
            error: {
                status: 500,
                message: 'Server error'
            }
        });
    }
});

// Create new template
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, category, content, projectId } = req.body;

        const template = new Template({
            name,
            description,
            category,
            content,
            owner: req.user.id,
            project: projectId,
            isPublic: false
        });

        await template.save();
        res.json(template);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update template
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { name, description, category, isPublic } = req.body;
        template.name = name || template.name;
        template.description = description || template.description;
        template.category = category || template.category;
        template.isPublic = isPublic !== undefined ? isPublic : template.isPublic;

        await template.save();
        res.json(template);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await template.remove();
        res.json({ message: 'Template removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 