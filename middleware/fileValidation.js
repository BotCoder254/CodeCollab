const path = require('path');

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.html', '.css', 
    '.json', '.md', '.txt', '.py', '.java'
];

function validateFile(req, res, next) {
    const { name, content } = req.body;

    // Check file name
    if (!name) {
        return res.status(400).json({ message: 'File name is required' });
    }

    // Check file extension
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ 
            message: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` 
        });
    }

    // Check content size
    if (content && Buffer.byteLength(content) > MAX_FILE_SIZE) {
        return res.status(400).json({ 
            message: 'File size exceeds maximum limit of 1MB' 
        });
    }

    next();
}

module.exports = validateFile; 