/**
 * backend/server.js
 * Entry point của Backend API — Node.js + Express
 * 
 * Cài đặt: npm install express multer jsonwebtoken bcrypt pg uuid cors helmet morgan
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const authRoutes    = require('./routes/auth-routes');
const problemRoutes = require('./routes/problems');
const submitRoutes  = require('./routes/submit');
const submissionCodeRoutes = require('./routes/submission-code'); // ADDED
const boardRoutes   = require('./routes/leaderboard');
const violationRoutes = require('./routes/violations');
const db            = require('@tin-hoc-tre/shared');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/problems',    problemRoutes);
app.use('/api/submit',      submitRoutes);
app.use('/api/submissions-code', submissionCodeRoutes); // ADDED
app.use('/api/leaderboard', boardRoutes);
app.use('/api/violations',  violationRoutes);

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Global error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Lỗi máy chủ nội bộ',
  });
});

app.listen(PORT, async () => {
  try {
    await db.initDB();
    console.log(`[Server] Đang chạy tại http://localhost:${PORT}`);
  } catch (err) {
    console.error('[Server Fail] Không thể khởi tạo DB:', err);
    process.exit(1);
  }
});

module.exports = app;
