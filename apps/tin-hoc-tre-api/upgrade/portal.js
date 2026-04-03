/**
 * backend/routes/portal.js
 * Serve Contest Portal và route bổ sung cho lịch sử nộp bài.
 * 
 * Thêm vào server.js:
 *   const portalRoutes = require('./routes/portal');
 *   app.use('/', portalRoutes);
 */

'use strict';

const express = require('express');
const path    = require('path');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

const router   = express.Router();
const PORTAL   = path.join(__dirname, '../../portal');
const EDITOR   = path.join(__dirname, '../../editor-build'); // Build của scratch-gui

// ── Serve Contest Portal ─────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.sendFile(path.join(PORTAL, 'index.html'));
});
router.use('/portal', express.static(PORTAL));

// ── Serve TurboWarp Editor (build của scratch-gui) ────────────────────────
// URL: /editor → trả về scratch-gui build với extension đã nhúng sẵn
router.use('/editor', express.static(EDITOR));
router.get('/editor', (req, res) => {
  res.sendFile(path.join(EDITOR, 'index.html'));
});

// ── GET /api/submit/history/:problem_id ──────────────────────────────────
// Lấy danh sách bài nộp của thí sinh cho một đề (để hiển thị "Lần nộp")
router.get('/api/submit/history/:problem_id', requireAuth, async (req, res, next) => {
  try {
    const { problem_id } = req.params;
    if (!/^[\w-]+$/.test(problem_id)) {
      return res.status(400).json({ error: 'ID đề không hợp lệ.' });
    }

    const { rows } = await db.query(
      `SELECT id, problem_id, score, total_score, status, judge_log, submitted_at, judged_at
       FROM submissions
       WHERE user_id = $1 AND problem_id = $2
       ORDER BY submitted_at DESC
       LIMIT 20`,
      [req.user.id, problem_id]
    );

    // Trả về judge_log rút gọn (không gồm output chi tiết)
    const safe = rows.map(r => ({
      ...r,
      judge_log: Array.isArray(r.judge_log)
        ? r.judge_log.map(({ index, passed, status, ms, weight }) => ({ index, passed, status, ms, weight }))
        : null,
    }));

    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// ── GET /leaderboard ─────────────────────────────────────────────────────
// Serve leaderboard page (SPA hoặc SSR đơn giản)
router.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(PORTAL, 'leaderboard.html'));
});

// ── POST /api/violations ─────────────────────────────────────────────────
// Ghi log vi phạm từ anti-cheat client
router.post('/api/violations', requireAuth, async (req, res) => {
  const { type, data, timestamp } = req.body;
  // Lưu vào DB hoặc chỉ log (đơn giản hóa ở đây)
  console.warn(`[Violation] User: ${req.user.username} | ${type} | ${JSON.stringify(data)}`);
  // Có thể INSERT vào bảng violations nếu cần
  res.json({ ok: true });
});

module.exports = router;
