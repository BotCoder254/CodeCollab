const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Middleware to check project access
async function checkProjectAccess(req, res, next) {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const project = await Project.findById(file.project);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner or collaborator
        const isCollaborator = project.collaborators.some(
            collab => collab.user.toString() === req.user.id
        );
        const isOwner = project.owner.toString() === req.user.id;

        if (!isCollaborator && !isOwner) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Add project and file to request object
        req.project = project;
        req.projectFile = file;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

// Get all files for a project with access control
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id
        ) || project.owner.toString() === req.user.id;

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const files = await File.find({ project: req.params.projectId })
            .select('name updatedAt')
            .sort({ updatedAt: -1 });

        res.json(files);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single file with access control
router.get('/:id', auth, checkProjectAccess, async (req, res) => {
    res.json(req.projectFile);
});

// Create new file with project access check
router.post('/', auth, async (req, res) => {
    try {
        const { name, content, projectId } = req.body;

        // Check project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const hasAccess = project.collaborators.some(
            collab => collab.user.toString() === req.user.id && collab.role !== 'viewer'
        ) || project.owner.toString() === req.user.id;

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check for duplicate file names
        const existingFile = await File.findOne({ 
            project: projectId, 
            name: name 
        });

        if (existingFile) {
            return res.status(400).json({ 
                message: 'A file with this name already exists in the project' 
            });
        }

        const file = new File({
            name,
            content,
            project: projectId
        });

        await file.save();

        // Add file reference to project
        project.files.push(file._id);
        await project.save();

        res.json(file);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update file with access control
router.put('/:id', auth, checkProjectAccess, async (req, res) => {
    try {
        const { content } = req.body;

        // Check if user has edit permissions
        const hasEditAccess = req.project.collaborators.some(
            collab => collab.user.toString() === req.user.id && collab.role !== 'viewer'
        ) || req.project.owner.toString() === req.user.id;

        if (!hasEditAccess) {
            return res.status(403).json({ message: 'You do not have edit permissions' });
        }

        const file = await File.findByIdAndUpdate(
            req.params.id,
            { 
                content,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json(file);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete file with access control
router.delete('/:id', auth, checkProjectAccess, async (req, res) => {
    try {
        // Check if user has admin/owner permissions
        const hasAdminAccess = req.project.collaborators.some(
            collab => collab.user.toString() === req.user.id && collab.role === 'admin'
        ) || req.project.owner.toString() === req.user.id;

        if (!hasAdminAccess) {
            return res.status(403).json({ message: 'You do not have permission to delete files' });
        }

        // Remove file reference from project
        req.project.files = req.project.files.filter(
            fileId => fileId.toString() !== req.params.id
        );
        await req.project.save();

        // Delete the file
        await File.findByIdAndDelete(req.params.id);

        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// New route to handle file rename
router.patch('/:id/rename', auth, checkProjectAccess, async (req, res) => {
    try {
        const { newName } = req.body;

        // Check for edit permissions
        const hasEditAccess = req.project.collaborators.some(
            collab => collab.user.toString() === req.user.id && collab.role !== 'viewer'
        ) || req.project.owner.toString() === req.user.id;

        if (!hasEditAccess) {
            return res.status(403).json({ message: 'You do not have edit permissions' });
        }

        // Check for duplicate names
        const existingFile = await File.findOne({
            project: req.project._id,
            name: newName,
            _id: { $ne: req.params.id }
        });

        if (existingFile) {
            return res.status(400).json({ 
                message: 'A file with this name already exists in the project' 
            });
        }

        const file = await File.findByIdAndUpdate(
            req.params.id,
            { 
                name: newName,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json(file);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
