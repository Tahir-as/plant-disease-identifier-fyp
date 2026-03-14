const jwt = require('jsonwebtoken');

/**
 * protect middleware — verifies the Bearer JWT from the Authorization header.
 * Attaches the decoded user payload to req.user so downstream routes can use it.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

/**
 * adminOnly middleware — must be used after protect.
 * Ensures only admin-role users can access the route.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden — admin access only' });
  }
};

module.exports = { protect, adminOnly };
