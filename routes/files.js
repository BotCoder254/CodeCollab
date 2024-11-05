const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const Project = require('../models/Project');

// Get all files for a project
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const files = await File.find({ project: req.params.projectId });
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new file or folder
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, parentId, projectId, content, language } = req.body;

        // Check if project exists and user has access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id && ['admin', 'write'].includes(collab.role)
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check for duplicate names in the same directory
        const existingFile = await File.findOne({
            project: projectId,
            parent: parentId || null,
            name: name
        });

        if (existingFile) {
            return res.status(400).json({ error: 'A file or folder with this name already exists' });
        }

        const file = new File({
            name,
            type: type || 'file',
            parent: parentId || null,
            project: projectId,
            content: content || '',
            language: language || 'plaintext'
        });

        await file.save();
        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get file content
router.get('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findById(file.project);
        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update file content or rename
router.put('/:id', auth, async (req, res) => {
    try {
        const { content, name } = req.body;
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findById(file.project);
        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id && ['admin', 'write'].includes(collab.role)
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (name) {
            const existingFile = await File.findOne({
                project: file.project,
                parent: file.parent,
                name: name,
                _id: { $ne: file._id }
            });

            if (existingFile) {
                return res.status(400).json({ error: 'A file with this name already exists' });
            }

            file.name = name;
        }

        if (content !== undefined) {
            file.content = content;
        }

        await file.save();
        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Move file
router.put('/move', auth, async (req, res) => {
    try {
        const { sourcePath, targetPath, projectId } = req.body;
        const file = await File.findOne({ path: sourcePath, project: projectId });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findById(projectId);
        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id && ['admin', 'write'].includes(collab.role)
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        file.path = targetPath;
        await file.save();
        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete file or folder
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findById(file.project);
        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id && ['admin', 'write'].includes(collab.role)
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (file.type === 'folder') {
            // Delete all files in the folder
            await File.deleteMany({ path: new RegExp(`^${file.path}/`) });
        }

        await file.remove();
        res.json({ message: 'File deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;