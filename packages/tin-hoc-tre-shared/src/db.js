/**
 * backend/db.js
 * Kết nối PostgreSQL và khởi tạo schema
 * 
 * Cài đặt: npm install pg
 * Tạo DB: createdb tinhoctre
 */

'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'tinhoctre',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASS     || '',
  max:      10,   // connection pool
});

// ── Schema SQL ───────────────────────────────────────────────────────────
const SCHEMA = `
-- Thí sinh
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  full_name  VARCHAR(100),
  school     VARCHAR(200),
  grade      SMALLINT,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Phiên thi
CREATE TABLE IF NOT EXISTS contest_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id   VARCHAR(50) NOT NULL,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT TRUE
);

-- Bài nộp
CREATE TABLE IF NOT EXISTS submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id     VARCHAR(50) NOT NULL,
  session_id     UUID REFERENCES contest_sessions(id),
  sb3_data       BYTEA NOT NULL,              -- File .sb3 nhị phân
  score          SMALLINT DEFAULT 0,
  total_score    SMALLINT DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'pending',  -- pending|judging|accepted|wrong|tle|error
  judge_log      JSONB,                       -- Chi tiết từng testcase
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  judged_at      TIMESTAMPTZ,
  -- Thời gian tính cho xếp hạng (phút kể từ đầu thi)
  penalty_minutes INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_submissions_user    ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);

-- Ghi nhận vi phạm
CREATE TABLE IF NOT EXISTS violations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL, -- devtools_open|debugger_detected|external_paste
  data         JSONB,                -- Chi tiết (count, target, timestamp)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_user ON violations(user_id);
`;

/**
 * Khởi tạo schema (chạy 1 lần khi server start)
 */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    console.log('[DB] Schema sẵn sàng.');
  } finally {
    client.release();
  }
}

/**
 * Tiện ích truy vấn
 */
const db = {
  query:   (sql, params) => pool.query(sql, params),
  connect: ()            => pool.connect(),
  initDB,
};

module.exports = db;
