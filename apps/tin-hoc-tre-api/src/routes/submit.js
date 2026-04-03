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

    const { board_participant_id, exam_id, quest_id, is_dry_run } = req.body;
    if (!board_participant_id || !exam_id || !quest_id) {
      return res.status(400).json({ error: 'Thiếu thông tin board_participant_id, exam_id hoặc quest_id.' });
    }

    const isDryRun = is_dry_run === 'true' || is_dry_run === true;

    const submissionId = uuidv4();
    const sb3Buffer    = req.file.buffer;
    const fileName     = `${board_participant_id}/${submissionId}.sb3`;

    // ── 1. Tải lên Supabase Storage ──────────────────────────────────────
    const { data: uploadData, error: uploadError } = await db.supabase.storage
      .from('submissions')
      .upload(fileName, sb3Buffer, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (uploadError) {
      console.error('[Storage Error] Lỗi tải file:', uploadError);
      console.error('[Storage Error Details] Bucket: submissions, Path:', fileName);
      return res.status(500).json({ 
        error: 'Lỗi khi lưu trữ file bài nộp.',
        details: uploadError.message,
        hint: 'Kiểm tra RLS Policy hoặc Bucket tồn tại.'
      });
    }

    const storagePath = uploadData.path;

    // ── 2. Lưu vào DB với status = 'pending' ────────────────────────────────
    try {
      await db.query(
        `INSERT INTO submissions (id, board_participant_id, exam_id, quest_id, storage_path, status, submitted_at, is_dry_run)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), $6)`,
        [submissionId, board_participant_id, exam_id, quest_id, storagePath, isDryRun]
      );
    } catch (dbErr) {
      console.error('[DB Error] Lỗi khi tạo bản ghi submission:', dbErr.message);
      console.error('Values:', { submissionId, board_participant_id, exam_id, quest_id });
      throw dbErr;
    }

    // ── 3. Đẩy vào hàng đợi Judge ────────────────────────────────────────
    await judgeQueue.add(
      { submissionId, boardParticipantId: board_participant_id, examId: exam_id, questId: quest_id, isDryRun },
      {
        attempts:    3,
        backoff:     { type: 'fixed', delay: 2000 },
        timeout:     120000,
        removeOnComplete: true,
        removeOnFail:     false,
      }
    );

    res.status(202).json({
      submission_id: submissionId,
      status:        'pending',
      message:       'Bài nộp đã được tải lên và đang trong hàng đợi chấm.',
      storage_path:  storagePath
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/submit/history/:quest_id ────────────────────────────────────
// Lấy lịch sử nộp bài của thí sinh cho một câu hỏi cụ thể
router.get('/history/:quest_id', requireAuth, async (req, res, next) => {
  try {
    const { quest_id } = req.params;
    const { exam_id } = req.query;

    const { rows } = await db.query(
      `SELECT s.id, s.quest_id, s.score, s.status, s.submitted_at, s.judged_at, s.is_dry_run
       FROM submissions s
       JOIN board_participants bp ON s.board_participant_id = bp.id
       WHERE bp.user_id = $1 AND s.quest_id = $2
       ${exam_id ? 'AND s.exam_id = $3' : ''}
       ORDER BY s.submitted_at DESC
       LIMIT 20`,
      exam_id ? [req.user.id, quest_id, exam_id] : [req.user.id, quest_id]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/submit/:id ──────────────────────────────────────────────────
// Thí sinh polling để lấy kết quả
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.quest_id, s.score, s.status, s.judge_log, s.submitted_at, s.judged_at, s.is_dry_run
       FROM submissions s
       JOIN board_participants bp ON s.board_participant_id = bp.id
       WHERE s.id = $1 AND bp.user_id = $2`,
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
