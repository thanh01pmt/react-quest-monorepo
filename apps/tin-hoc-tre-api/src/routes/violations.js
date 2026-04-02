/**
 * src/routes/violations.js
 * Tiếp nhận báo cáo vi phạm gian lận từ trình duyệt thí sinh
 */

'use strict';

const express = require('express');
const db      = require('@tin-hoc-tre/shared');
const { requireAuth } = require('../middleware/auth-middleware');

const router = express.Router();

// POST /api/violations
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { type, data, timestamp } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Thiếu loại vi phạm (type).' });
    }

    // Lưu log vào Database
    await db.query(
      `INSERT INTO violations (user_id, type, data, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user.id, 
        type, 
        data ? JSON.stringify(data) : null,
        timestamp ? new Date(timestamp) : new Date()
      ]
    );

    console.warn(`[Violation] ${req.user.username} - ${type}`);

    res.status(201).json({ status: 'logged' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
