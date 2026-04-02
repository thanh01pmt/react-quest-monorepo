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
const path    = require('path');
const fs      = require('fs').promises;
const { requireAuth } = require('../middleware/auth-middleware');

const router = express.Router();
const PROBLEMS_DIR = path.join(__dirname, '../../../../packages/tin-hoc-tre-problems/data');

// ── GET /api/problems ────────────────────────────────────────────────────
// Danh sách đề có thể thi
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const files = await fs.readdir(PROBLEMS_DIR);
    const publicFiles = files.filter(f => f.endsWith('.public.json'));

    const list = await Promise.all(publicFiles.map(async (f) => {
      const raw  = await fs.readFile(path.join(PROBLEMS_DIR, f), 'utf8');
      const data = JSON.parse(raw);
      return {
        problem_id:  data.problem_id,
        title:       data.title,
        description: data.description,
        time_limit:  data.time_limit,
        total_score: data.test_cases.reduce((s, t) => s + (t.weight || 10), 0),
      };
    }));

    res.json(list);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/problems/:id ────────────────────────────────────────────────
// Tải chi tiết đề (bao gồm testcase mẫu — KHÔNG có testcase ẩn)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Validate: chỉ cho phép ký tự an toàn để tránh path traversal
    if (!/^[\w-]+$/.test(id)) {
      return res.status(400).json({ error: 'ID đề không hợp lệ.' });
    }

    const filePath = path.join(PROBLEMS_DIR, `${id}.public.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const problem = JSON.parse(raw);

    // KHÔNG trả về expected trong testcase mẫu (thí sinh có thể thấy)
    // Chỉ giữ input mẫu để thí sinh debug
    const safeTestCases = problem.test_cases.map((tc, i) => ({
      index:  i + 1,
      weight: tc.weight,
      input:  tc.input,
      // expected bị giấu — frontend chỉ thấy khi kết quả trả về
    }));

    res.json({ ...problem, test_cases: safeTestCases });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: `Không tìm thấy đề: ${req.params.id}` });
    }
    next(err);
  }
});

module.exports = router;
