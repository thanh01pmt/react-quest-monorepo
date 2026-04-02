'use strict';

const jwt = require('jsonwebtoken');

// Supabase JWT Secret từ dashboard Setting > API
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'your-supabase-jwt-secret';

/**
 * Middleware: kiểm tra JWT Bearer token phát hành bởi Supabase
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng cung cấp token từ Supabase.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET);
    // Supabase payload thường có: sub (user_id), email, role, ...
    req.user = {
      id: payload.sub,
      email: payload.email,
      ...payload
    };
    next();
  } catch (err) {
    console.error('[Auth] Token invalid:', err.message);
    return res.status(403).json({ error: 'Token không hợp lệ hoặc không có quyền truy cập.' });
  }
}

/**
 * Tạo JWT token (Dùng cho test nội bộ, production nên dùng Supabase auth)
 */
function signToken(payload) {
  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { requireAuth, signToken };
