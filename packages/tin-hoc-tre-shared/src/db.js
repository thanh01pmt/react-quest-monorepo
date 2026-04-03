/**
 * backend/db.js
 * Kết nối PostgreSQL và khởi tạo schema
 * 
 * Cài đặt: npm install pg
 * Tạo DB: createdb tinhoctre
 */

'use strict';

const { Pool } = require('pg');

// Kết nối thông qua Connection String (Ưu tiên) hoặc các biến môi trường rời rạc
const connectionString = process.env.DATABASE_URL;

const pool = connectionString 
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'tinhoctre',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASS     || '',
      max:      10,
    });

// ── Schema SQL (Supabase Sync) ───────────────────────────────────────────
const SCHEMA = `
-- Lưu ý: Schema chính được quản lý bởi migration.sql trong contest-dashboard.
-- Ở đây chúng ta chỉ đảm bảo các bảng cần thiết tồn tại hoặc được cập nhật.

-- Bổ sung cột storage_path nếu chưa có trong submissions (để lưu file Scratch)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='storage_path') THEN
    ALTER TABLE submissions ADD COLUMN storage_path TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='judge_log') THEN
    ALTER TABLE submissions ADD COLUMN judge_log JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='status') THEN
    ALTER TABLE submissions ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='is_dry_run') THEN
    ALTER TABLE submissions ADD COLUMN is_dry_run BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
`;

/**
 * Khởi tạo schema mở rộng
 */
async function initDB() {
  let client;
  try {
    client = await pool.connect();
    // Đảm bảo schema cơ bản đã có (thường do Supabase migration chạy trước)
    await client.query(SCHEMA);
    console.log('[DB] Supabase Schema extensions sẵn sàng.');
  } catch (err) {
    console.error('[DB] Lỗi kết nối hoặc khởi tạo schema:', err.message);
    console.warn('[DB] Cảnh báo: Một số tính năng Judge có thể không hoạt động do thiếu Database.');
  } finally {
    if (client) client.release();
  }
}

const supabase = require('./supabase');

/**
 * Tiện ích truy vấn
 */
const db = {
  query:   (sql, params) => pool.query(sql, params),
  connect: ()            => pool.connect(),
  initDB,
  supabase,
};

module.exports = db;
