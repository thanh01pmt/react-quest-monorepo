/**
 * backend/routes/leaderboard.js
 * Bảng xếp hạng theo chuẩn VNOJ:
 *   - Điểm cao nhất của mỗi bài
 *   - Cùng điểm → so thời gian nộp bài (+ phạt 5 phút/lần nộp sai)
 */

'use strict';

const express = require('express');
const db      = require('@tin-hoc-tre/shared');
const { requireAuth } = require('../middleware/auth-middleware');

const router = express.Router();
const WRONG_PENALTY_MINUTES = 5;

// ── GET /api/leaderboard/:problem_id ────────────────────────────────────
// Public access is allowed for this route (omit requireAuth for general viewing)
router.get('/:problem_id', async (req, res, next) => {
  try {
    const { problem_id } = req.params;
    if (!/^[\w-]+$/.test(problem_id)) {
      return res.status(400).json({ error: 'ID đề không hợp lệ.' });
    }

    // Tính điểm cao nhất + thời gian phạt cho từng user
    const { rows } = await db.query(`
      WITH ranked AS (
        SELECT
          s.user_id,
          u.full_name,
          u.school,
          u.grade,
          s.score,
          s.total_score,
          s.status,
          s.submitted_at,
          -- Số lần nộp sai trước lần đạt điểm cao nhất
          ROW_NUMBER() OVER (
            PARTITION BY s.user_id
            ORDER BY s.score DESC, s.submitted_at ASC
          ) AS rn,
          COUNT(*) FILTER (WHERE s.status = 'wrong') OVER (
            PARTITION BY s.user_id
          ) AS wrong_count
        FROM submissions s
        JOIN users u ON u.id = s.user_id
        WHERE s.problem_id = $1
          AND s.status IN ('accepted', 'wrong', 'partial')
      )
      SELECT
        user_id,
        full_name,
        school,
        grade,
        score,
        total_score,
        submitted_at,
        wrong_count,
        -- Phút từ đầu thi (giả sử contest_start từ env)
        EXTRACT(EPOCH FROM (submitted_at - $2::TIMESTAMPTZ)) / 60
          + (wrong_count * $3) AS penalty_minutes
      FROM ranked
      WHERE rn = 1
      ORDER BY score DESC, penalty_minutes ASC
      LIMIT 100
    `, [
      problem_id,
      process.env.CONTEST_START_TIME || '2025-01-01T07:30:00Z',
      WRONG_PENALTY_MINUTES,
    ]);

    // Đánh số thứ hạng (xử lý đồng hạng)
    let rank = 1;
    const board = rows.map((row, i) => {
      if (i > 0 && row.score !== rows[i - 1].score) rank = i + 1;
      return {
        rank,
        full_name:      row.full_name,
        school:         row.school,
        grade:          row.grade,
        score:          row.score,
        total_score:    row.total_score,
        penalty_minutes: Math.round(row.penalty_minutes),
        submitted_at:   row.submitted_at,
      };
    });

    res.json({ problem_id, leaderboard: board, updated_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/leaderboard/:problem_id/me ─────────────────────────────────
// Lấy vị trí xếp hạng của bản thân
router.get('/:problem_id/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT score, total_score, status, submitted_at
       FROM submissions
       WHERE user_id = $1 AND problem_id = $2
       ORDER BY score DESC, submitted_at ASC
       LIMIT 1`,
      [req.user.id, req.params.problem_id]
    );

    if (!rows.length) {
      return res.json({ submitted: false });
    }

    res.json({ submitted: true, best: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
