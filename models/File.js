const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
        default: 'file'
    },
    path: {
        type: String,
        default: '/'
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        default: null
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    language: {
        type: String,
        default: 'plaintext'
    }
});

// Update the updatedAt timestamp before saving
FileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to get full path
FileSchema.methods.getFullPath = async function() {
    let path = this.name;
    let current = this;
    
    while (current.parent) {
        current = await this.model('File').findById(current.parent);
        if (current) {
            path = current.name + '/' + path;
        }
    }
    
    return path;
};

module.exports = mongoose.model('File', FileSchema);