/**
 * backend/routes/auth.js
 * Đăng ký và đăng nhập thí sinh
 */

'use strict';

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('@tin-hoc-tre/shared');
const { requireAuth, signToken } = require('../middleware/auth-middleware');

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, full_name, school, grade } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu username hoặc password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải ít nhất 6 ký tự.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (username, password, full_name, school, grade)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name`,
      [username.trim().toLowerCase(), hashed, full_name, school, grade]
    );

    const user = rows[0];
    const token = signToken({ id: user.id, username: user.username });

    res.status(201).json({ token, user: { id: user.id, username: user.username, full_name: user.full_name } });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'Username đã tồn tại.' });
    }
    next(err);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu username hoặc password.' });
    }

    const { rows } = await db.query(
      'SELECT id, username, password, full_name, grade FROM users WHERE username = $1',
      [username.trim().toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu.' });
    }

    const token = signToken({ id: user.id, username: user.username, grade: user.grade });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, grade: user.grade } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
