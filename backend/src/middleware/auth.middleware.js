import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_token_key_123456');

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { user_id: decoded.id },
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an administrator.' });
  }
};
