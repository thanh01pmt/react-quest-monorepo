/**
 * backend/judge/worker.js
 * 
 * Worker lắng nghe hàng đợi Bull, chạy file .sb3 trong scratch-vm headless,
 * so sánh kết quả với testcase ẩn và trả về điểm số.
 * 
 * Cài đặt:
 *   npm install bull scratch-vm adm-zip
 *   npm install scratch-vm --prefix ./judge_env
 * 
 * Chạy: node judge/worker.js
 * Hoặc với PM2: pm2 start judge/worker.js --name judge-worker -i 4
 */

'use strict';

const Queue   = require('bull');
const path    = require('path');
const fs      = require('fs').promises;
const db      = require('@tin-hoc-tre/shared');
const { ScratchRunner } = require('./scratch-runner');

// ── Kết nối cùng queue với server.js ────────────────────────────────────
const judgeQueue = new Queue('judge', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
});

const PROBLEMS_DIR     = path.join(__dirname, '../../../packages/tin-hoc-tre-problems/data');
const TIME_LIMIT_MS    = parseInt(process.env.JUDGE_TIME_LIMIT_MS || '5000');
const MEMORY_LIMIT_MB  = parseInt(process.env.JUDGE_MEMORY_MB     || '256');

console.log('[Judge Worker] Đang chờ bài nộp...');

// ── Xử lý từng job ──────────────────────────────────────────────────────
judgeQueue.process(
  2, // Xử lý tối đa 2 job đồng thời (1 worker = 2 luồng)
  async (job) => {
    const { submissionId, problemId } = job.data;
    console.log(`[Judge] Bắt đầu: ${submissionId} | bài: ${problemId}`);

    // ── 1. Đánh dấu đang chấm ────────────────────────────────────────
    await db.query(
      `UPDATE submissions SET status = 'judging' WHERE id = $1`,
      [submissionId]
    );

    // ── 2. Tải file .sb3 từ DB ───────────────────────────────────────
    const { rows } = await db.query(
      'SELECT sb3_data FROM submissions WHERE id = $1',
      [submissionId]
    );
    if (!rows.length) throw new Error(`Không tìm thấy submission: ${submissionId}`);
    const sb3Buffer = rows[0].sb3_data;

    // ── 3. Tải testcase ẨN ───────────────────────────────────────────
    const hiddenPath = path.join(PROBLEMS_DIR, `${problemId}.hidden.json`);
    let hiddenProblem;
    try {
      hiddenProblem = JSON.parse(await fs.readFile(hiddenPath, 'utf8'));
    } catch {
      throw new Error(`Không tìm thấy testcase ẩn: ${problemId}.hidden.json`);
    }

    const testCases  = hiddenProblem.test_cases;
    const totalScore = testCases.reduce((s, t) => s + (t.weight || 10), 0);
    const log        = [];
    let   score      = 0;
    let   finalStatus = 'wrong';

    // ── 4. Chạy từng testcase ────────────────────────────────────────
    for (let i = 0; i < testCases.length; i++) {
      const tc     = testCases[i];
      const tcName = `Testcase ${i + 1}`;

      let result;
      try {
        result = await ScratchRunner.run({
          sb3Buffer,
          input:       tc.input,
          expected:    tc.expected,
          timeLimitMs: hiddenProblem.time_limit_ms || TIME_LIMIT_MS,
          memLimitMB:  MEMORY_LIMIT_MB,
        });
      } catch (err) {
        result = { passed: false, status: 'error', output: [], error: err.message, ms: 0 };
      }

      const passed = result.passed;
      if (passed) score += (tc.weight || 10);

      log.push({
        index:    i + 1,
        weight:   tc.weight || 10,
        passed,
        status:   result.status,
        output:   result.output?.slice(0, 20), // Giới hạn log gửi về
        expected: tc.expected?.slice(0, 20),
        ms:       result.ms,
      });

      console.log(`[Judge]   ${tcName}: ${passed ? '✅' : '❌'} (${result.ms}ms, ${result.status})`);
      await job.progress(Math.round(((i + 1) / testCases.length) * 100));
    }

    // ── 5. Tổng hợp kết quả ──────────────────────────────────────────
    const hasAnyTLE   = log.some(l => l.status === 'tle');
    const hasAnyError = log.some(l => l.status === 'error');

    if (score === totalScore)     finalStatus = 'accepted';
    else if (score > 0)          finalStatus = 'partial';
    else if (hasAnyTLE)          finalStatus = 'tle';
    else if (hasAnyError)        finalStatus = 'error';
    else                         finalStatus = 'wrong';

    // Cập nhật DB (job 'completed' event trong server.js cũng làm điều này,
    // nhưng ghi thẳng tại đây để chắc chắn)
    await db.query(
      `UPDATE submissions
       SET score = $1, total_score = $2, status = $3, judge_log = $4, judged_at = NOW()
       WHERE id = $5`,
      [score, totalScore, finalStatus, JSON.stringify(log), submissionId]
    );

    console.log(`[Judge] Hoàn thành: ${submissionId} → ${score}/${totalScore} (${finalStatus})`);
    return { score, totalScore, status: finalStatus, log };
  }
);

// ── Xử lý worker bị crash ────────────────────────────────────────────────
process.on('uncaughtException',  err => console.error('[Worker] Uncaught:', err));
process.on('unhandledRejection', err => console.error('[Worker] Unhandled:', err));
