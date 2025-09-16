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
  const roleName = req.user?.role?.name || req.user?.role; 
  if (!req.user || roleName !== 'Admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

function requirePersonal(req, res, next) {
    const roleName = req.user?.role?.name || req.user?.role;
    if (!req.user || (roleName !== 'Admin' && roleName !== 'Staff')) {
      return res.status(403).json({ message: 'Staff or Admin only' });
    }
    next();
}

module.exports = { auth, requireAdmin, requirePersonal };