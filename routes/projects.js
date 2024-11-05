const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const Project = require('../models/Project');

const User = require('../models/User');

const File = require('../models/File');



// Create new project

router.post('/', auth, async(req, res) => {

    try {

        const user = await User.findById(req.user.id).select('-password');

        const { name, description } = req.body;



        // Create project

        const project = new Project({

            name,

            description,

            owner: user._id,

            collaborators: [{ user: user._id, role: 'admin' }]

        });



        await project.save();



        // Return the created project with populated fields

        const populatedProject = await Project.findById(project._id)

            .populate('owner', ['username', 'email'])

            .populate('collaborators.user', ['username', 'email']);



        res.json(populatedProject);

    } catch (err) {

        console.error(err.message);

        res.status(500).json({ error: 'Failed to create project' });

    }

});



// Get all projects for user

router.get('/', auth, async(req, res) => {

    try {

        const user = await User.findById(req.user.id).select('-password');

        const projects = await Project.find({

            $or: [

                { owner: req.user.id },

                { 'collaborators.user': req.user.id }

            ]

        })

        .populate('owner', ['username', 'email'])

        .populate('collaborators.user', ['username', 'email'])

        .sort({ updatedAt: -1 });



        res.render('pages/projects', {

            title: 'My Projects',

            user: user,

            projects: projects,

            path: '/projects'

        });

    } catch (err) {

        console.error(err.message);

        res.status(500).render('pages/error', {

            error: {

                status: 500,

                message: 'Error loading projects'

            }

        });

    }

});



// Add collaborator to project

router.post('/:id/collaborators', auth, async(req, res) => {

    try {

        const { email, role } = req.body;

        const project = await Project.findById(req.params.id);



        if (!project) {

            return res.status(404).json({ msg: 'Project not found' });

        }



        if (project.owner.toString() !== req.user.id) {

            return res.status(401).json({ msg: 'Not authorized' });

        }



        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({ msg: 'User not found' });

        }



        // Check if user is already a collaborator

        if (project.collaborators.some(collab => collab.user.toString() === user.id)) {

            return res.status(400).json({ msg: 'User is already a collaborator' });

        }



        project.collaborators.push({ user: user.id, role });

        await project.save();

        res.json(project);

    } catch (err) {

        console.error(err.message);

        res.status(500).send('Server error');

    }

});



// Create version snapshot

router.post('/:id/versions', auth, async(req, res) => {

    try {

        const { description } = req.body;

        const project = await Project.findById(req.params.id);



        if (!project) {

            return res.status(404).json({ msg: 'Project not found' });

        }



        // Get all project files

        const files = await File.find({ project: project._id });



        // Create version snapshot

        project.versions.push({

            timestamp: Date.now(),

            description,

            files: files.map(file => ({

                id: file._id,

                name: file.name,

                content: file.content,

                path: file.path

            }))

        });



        await project.save();

        res.json(project);

    } catch (err) {

        console.error(err.message);

        res.status(500).send('Server error');

    }

});



// @route   GET /projects/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const project = await Project.findById(req.params.id)
            .populate('owner', ['username', 'email'])
            .populate('collaborators.user', ['username', 'email']);

        if (!project) {
            return res.status(404).render('pages/error', {
                error: {
                    status: 404,
                    message: 'Project not found'
                }
            });
        }

        // Check if user has access
        const hasAccess = project.collaborators.some(
            collab => collab.user._id.toString() === req.user.id
        );

        if (!hasAccess) {
            return res.status(403).render('pages/error', {
                error: {
                    status: 403,
                    message: 'Access denied'
                }
            });
        }

        res.render('pages/editor', {
            title: project.name,
            project,
            user: user,
            path: '/projects'
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



// @route   GET /projects/:id/settings
router.get('/:id/settings', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', ['username', 'email'])
            .populate('collaborators.user', ['username', 'email']);

        if (!project) {
            return res.status(404).render('404', { title: 'Project Not Found' });
        }

        if (project.owner._id.toString() !== req.user.id) {
            return res.status(403).render('error', {
                error: {
                    status: 403,
                    message: 'Access denied'
                }
            });
        }

        res.render('project-settings', {
            title: `${project.name} - Settings`,
            project,
            user: req.user,
            layout: 'layout'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', {
            error: {
                status: 500,
                message: 'Server error'
            }
        });
    }
});



module.exports = router;
