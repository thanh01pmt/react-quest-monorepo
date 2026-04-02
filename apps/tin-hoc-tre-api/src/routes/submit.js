/**
 * backend/routes/submit.js
 * Tiếp nhận bài nộp .sb3 và đưa vào hàng đợi máy chấm
 * 
 * Cài đặt: npm install multer bull
 * Bull cần Redis: docker run -d -p 6379:6379 redis
 */

'use strict';

const express = require('express');
const multer  = require('multer');
const Queue   = require('bull');
const { v4: uuidv4 } = require('uuid');
const db      = require('@tin-hoc-tre/shared');
const { requireAuth } = require('../middleware/auth-middleware');

const router = express.Router();

// ── Multer: nhận file .sb3 trong memory (không lưu disk tạm) ────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sb3') || file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .sb3'));
    }
  },
});

// ── Bull queue: giao tiếp với Judge worker qua Redis ────────────────────
const judgeQueue = new Queue('judge', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

// Lắng nghe kết quả từ worker và cập nhật DB
judgeQueue.on('completed', async (job, result) => {
  const { submissionId } = job.data;
  try {
    await db.query(
      `UPDATE submissions
       SET score = $1, status = $2, judge_log = $3, judged_at = NOW()
       WHERE id = $4`,
      [result.score, result.status, JSON.stringify(result.log), submissionId]
    );
    console.log(`[Queue] Chấm xong: ${submissionId} → ${result.score}đ (${result.status})`);
  } catch (err) {
    console.error('[Queue] Lỗi cập nhật kết quả:', err);
  }
});

judgeQueue.on('failed', async (job, err) => {
  const { submissionId } = job.data;
  console.error(`[Queue] Job thất bại (${submissionId}):`, err.message);
  await db.query(
    `UPDATE submissions SET status = 'error', judged_at = NOW() WHERE id = $1`,
    [submissionId]
  );
});

// ── POST /api/submit ─────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('sb3file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Chưa đính kèm file .sb3.' });
    }

    const { problem_id } = req.body;
    if (!problem_id || !/^[\w-]+$/.test(problem_id)) {
      return res.status(400).json({ error: 'Thiếu hoặc sai problem_id.' });
    }

    // ── Xác minh file .sb3 là ZIP hợp lệ (magic bytes: PK\x03\x04) ──────
    const magic = req.file.buffer.slice(0, 4);
    if (magic[0] !== 0x50 || magic[1] !== 0x4B) {
      return res.status(400).json({ error: 'File .sb3 bị hỏng (không đúng định dạng ZIP).' });
    }

    const submissionId = uuidv4();
    const sb3Buffer    = req.file.buffer;

    // ── Lưu vào DB với status = 'pending' ────────────────────────────────
    await db.query(
      `INSERT INTO submissions (id, user_id, problem_id, sb3_data, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [submissionId, req.user.id, problem_id, sb3Buffer]
    );

    // ── Đẩy vào hàng đợi Judge (KHÔNG truyền sb3 qua queue, chỉ ID) ─────
    await judgeQueue.add(
      { submissionId, problemId: problem_id, userId: req.user.id },
      {
        attempts:    3,                   // Thử lại tối đa 3 lần nếu worker crash
        backoff:     { type: 'fixed', delay: 2000 },
        timeout:     120000,              // Job timeout 2 phút
        removeOnComplete: true,
        removeOnFail:     false,          // Giữ lại failed jobs để debug
      }
    );

    res.status(202).json({
      submission_id: submissionId,
      status:        'pending',
      message:       'Bài nộp đang trong hàng đợi chấm. Vui lòng đợi kết quả.',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/submit/:id ──────────────────────────────────────────────────
// Thí sinh polling để lấy kết quả
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, problem_id, score, total_score, status, judge_log, submitted_at, judged_at
       FROM submissions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy bài nộp.' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
