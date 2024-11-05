const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'editor', 'viewer'],
            default: 'editor'
        }
    }],
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
ProjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Cascade delete files when a project is removed
ProjectSchema.pre('remove', async function(next) {
    await this.model('File').deleteMany({ project: this._id });
    next();
});

module.exports = mongoose.model('Project', ProjectSchema);