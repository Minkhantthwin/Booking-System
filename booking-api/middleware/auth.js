const jwt = require('jsonwebtoken');

function auth(required = true) {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header) {
            if (required) 
                return res.status(401).json({ message: 'Authorization header missing' });
                return next();
        }
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Invalid authorization header' });
        }
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
            req.user = payload;
            next();
        }
        catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 5 && req.user.roleId !== 5)) {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

module.exports = { auth, requireAdmin };