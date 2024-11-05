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

    }

});



FileSchema.pre('save', function(next) {

    this.updatedAt = Date.now();

    next();

});



// Add to the existing File schema
FileSchema.index({ project: 1, name: 1 }, { unique: true });
FileSchema.index({ updatedAt: -1 });



module.exports = mongoose.model('File', FileSchema);
