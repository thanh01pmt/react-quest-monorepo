/**
 * apps/tin-hoc-tre-api/src/routes/submission-code.js
 * 
 * Handles submission for logic (Blockly/JS/Python) challenges.
 * Performs real-time judging and returns results.
 */

'use strict';

const express = require('express');
const db = require('@tin-hoc-tre/shared');
const { requireAuth } = require('../middleware/auth-middleware');
const ExecutionService = require('../lib/execution-service');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { board_participant_id, exam_id, quest_id, code, language } = req.body;
    
    if (!board_participant_id || !exam_id || !quest_id || !code) {
      return res.status(400).json({ error: 'Missing required submission fields.' });
    }

    // 1. Fetch Quest Data from Exam
    const { rows: examRows } = await db.query(
      `SELECT quest_data FROM exams WHERE id = $1`,
      [exam_id]
    );

    if (!examRows.length) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const questData = examRows[0].quest_data.find(q => q.id === quest_id);
    if (!questData) {
      return res.status(404).json({ error: 'Quest not found in this exam.' });
    }

    const testCases = questData.test_cases || [];
    const timeLimit = questData.time_limit || 2000; // default 2s
    let totalScore = 0;
    let testResults = [];
    let combinedLogs = [];

    // 2. Execute Tests
    for (const [index, tc] of testCases.entries()) {
      let judgeResult;
      
      const lang = (language || questData.language || 'javascript').toLowerCase();

      if (lang === 'javascript' || lang === 'js') {
        // Keep JS execution local via worker_threads for performance
        judgeResult = await ExecutionService.executeJS(code, tc.input, timeLimit);
      } else {
        // Use Piston for Python, C, C++, etc.
        judgeResult = await ExecutionService.executeWithPiston(lang, code, tc.input, timeLimit);
      }

      const isCorrect = judgeResult.success && 
                        (String(judgeResult.result).trim() === String(tc.output).trim());
      
      const score = isCorrect ? (100 / testCases.length) : 0;
      totalScore += score;

      testResults.push({
        id: index + 1,
        input: tc.input,
        expected: tc.output,
        actual: judgeResult.result || judgeResult.error,
        status: isCorrect ? 'passed' : 'failed',
        timeMs: judgeResult.timeMs,
        workerLog: (judgeResult.logs || []).join('\n')
      });

      if (judgeResult.logs && judgeResult.logs.length > 0) {
        combinedLogs.push(`Test ${index + 1}:\n${judgeResult.logs.join('\n')}`);
      }
    }

    const submissionId = uuidv4();
    const finalScore = Math.round(totalScore);

    // 3. Save to Database
    await db.query(
      `INSERT INTO submissions (
        id, board_participant_id, exam_id, quest_id, 
        code, language, score, status, 
        test_results, worker_log, time_ms, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        submissionId, 
        board_participant_id, 
        exam_id, 
        quest_id, 
        code, 
        language || 'javascript', 
        finalScore, 
        finalScore >= 100 ? 'passed' : 'attempted',
        JSON.stringify(testResults),
        combinedLogs.join('\n\n'),
        testResults.reduce((sum, r) => sum + r.timeMs, 0),
      ]
    );

    // 4. Update Board Participant Score (Simplified logic for now)
    await db.query(
      `UPDATE board_participants 
       SET score = (SELECT SUM(max_score) FROM (
         SELECT quest_id, MAX(score) as max_score 
         FROM submissions 
         WHERE board_participant_id = $1 
         GROUP BY quest_id
       ) s)
       WHERE id = $1`,
      [board_participant_id]
    );

    res.json({
      submission_id: submissionId,
      score: finalScore,
      testResults,
      status: finalScore >= 100 ? 'passed' : 'attempted'
    });

  } catch (err) {
    console.error('[Submission Error]', err);
    next(err);
  }
});

module.exports = router;
