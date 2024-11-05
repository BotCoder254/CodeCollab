const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from session
    const token = req.session.token;

    // Check if no token
    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        req.session.destroy();
        res.redirect('/auth/login');
    }
};

module.exports = authMiddleware;
