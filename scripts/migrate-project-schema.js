require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function migrateProjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects to migrate`);

        for (const project of projects) {
            // Add files array if it doesn't exist
            if (!project.files) {
                project.files = [];
            }

            // Update collaborators structure if needed
            if (project.collaborators) {
                project.collaborators = project.collaborators.map(collab => {
                    if (typeof collab === 'string') {
                        return {
                            user: collab,
                            role: 'editor'
                        };
                    }
                    return collab;
                });
            }

            await project.save();
            console.log(`Migrated project: ${project._id}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateProjects(); 