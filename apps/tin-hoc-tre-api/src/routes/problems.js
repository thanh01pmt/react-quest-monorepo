/**
 * backend/routes/problems.js
 * Phân phối đề thi cho frontend (có xác thực)
 * 
 * Đề thi lưu tại: backend/problems/<id>.json
 * File này có 2 phiên bản:
 *   - <id>.public.json  → Chứa đề bài + testcases MẪU (gửi cho frontend)
 *   - <id>.hidden.json  → Chứa testcases ẨN (chỉ dùng cho headless judge)
 */

'use strict';

const express = require('express');
const db = require('@tin-hoc-tre/shared');
const { requireAuth } = require('../middleware/auth-middleware');

const router = express.Router();

// ── GET /api/problems/current ─────────────────────────────────────────────
// Lấy danh sách câu hỏi của đề thi hiện tại mà thí sinh đang tham gia
router.get('/current', requireAuth, async (req, res, next) => {
  try {
    // 1. Tìm board_participant của user này trong round đang ACTIVE
    const { rows: bpRows } = await db.query(
      `SELECT bp.id as board_participant_id, e.id as exam_id, e.title, e.quest_data, r.end_time, r.status as round_status
       FROM board_participants bp
       JOIN exam_boards eb ON bp.board_id = eb.id
       JOIN rounds r ON eb.round_id = r.id
       JOIN exams e ON r.id = e.round_id
       WHERE bp.participant_id = $1 AND r.status = 'active'
       LIMIT 1`,
      [req.user.id]
    );

    if (!bpRows.length) {
      return res.status(404).json({ error: 'Bạn không có đề thi nào đang diễn ra.' });
    }

    const exam = bpRows[0];
    
    // 2. Trả về thông tin đề thi và danh sách câu hỏi (không kèm testcase ẩn/expected)
    const safeQuests = exam.quest_data.map(q => ({
      id:          q.id,
      title:       q.title,
      description: q.description,
      time_limit:  q.time_limit,
      // Chỉ gửi test_cases mẫu nếu có
      test_cases:  (q.test_cases || []).filter(tc => tc.is_sample).map(tc => ({
        input: tc.input,
        output: tc.output
      }))
    }));

    res.json({
      board_participant_id: exam.board_participant_id,
      exam_id:              exam.exam_id,
      title:                exam.title,
      end_time:             exam.end_time,
      questions:            safeQuests
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/problems/:id (Chi tiết một câu hỏi) ──────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Tìm exam_id và quest_data của user trong round ACTIVE
    const { rows: bpRows } = await db.query(
      `SELECT e.quest_data
       FROM board_participants bp
       JOIN exam_boards eb ON bp.board_id = eb.id
       JOIN rounds r ON eb.round_id = r.id
       JOIN exams e ON r.id = e.round_id
       WHERE bp.participant_id = $1 AND r.status = 'active'
       LIMIT 1`,
      [req.user.id]
    );

    if (!bpRows.length) {
      return res.status(404).json({ error: 'Bạn không có đề thi nào đang diễn ra.' });
    }

    const questData = bpRows[0].quest_data || [];
    const quest = questData.find(q => q.id === id || q.problem_id === id);

    if (!quest) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi này trong đề thi của bạn.' });
    }

    // 2. Trả về quest đã filter test cases (chỉ sample)
    const safeQuest = {
      id:            quest.id || quest.problem_id,
      title:         quest.title,
      description:   quest.description,
      time_limit:    quest.time_limit,
      scratch_ui_mode: quest.scratch_ui_mode || 'upload',
      test_cases:    (quest.test_cases || []).filter(tc => tc.is_sample).map(tc => ({
        id: tc.id,
        is_sample: true,
        input: tc.input,
        output: tc.output
      }))
    };

    res.json(safeQuest);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
