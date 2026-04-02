/**
 * backend/middleware/auth.js
 * Middleware xác thực JWT cho các route cần đăng nhập
 */

'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'doi-bi-mat-nay-trong-production';

/**
 * Middleware: kiểm tra JWT Bearer token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng cung cấp token.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, grade }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

/**
 * Tạo JWT token
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); // Hết hạn sau 8 giờ thi
}

module.exports = { requireAuth, signToken };
