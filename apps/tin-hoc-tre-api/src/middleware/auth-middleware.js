'use strict';

const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

/**
 * Middleware: kiểm tra JWT Bearer token phát hành bởi Supabase
 * Sử dụng supabase.auth.getUser(token) để hỗ trợ cả thuật toán ES256 và HS256
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng cung cấp token từ Supabase.' });
  }

  const token = authHeader.slice(7);

  try {
    // Sử dụng SDK chính thức để xác thực token. 
    // Phương pháp này tự động xử lý Key Rotation và Thuật toán (ES256/HS256)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (error) console.error('[Auth Error]', error.message);
      return res.status(403).json({ error: 'Token không hợp lệ hoặc không có quyền truy cập.' });
    }

    // Gán thông tin user vào request
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth System Error]', err.message);
    return res.status(500).json({ error: 'Lỗi hệ thống xác thực.' });
  }
}

/**
 * Hàm dummy cho tương thích ngược (nếu cần dùng jsonwebtoken thủ công)
 */
const jwt = require('jsonwebtoken');
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'secret';
function signToken(payload) {
  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { requireAuth, signToken };
