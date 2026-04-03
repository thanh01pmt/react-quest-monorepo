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
const { ScratchAnalyzer } = require('./scratch-analyzer');

// ── Kết nối cùng queue với server.js ────────────────────────────────────
const judgeQueue = new Queue('judge', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
});

const PROBLEMS_DIR     = path.join(__dirname, '../../../packages/tin-hoc-tre-problems/data');
const TIME_LIMIT_MS    = parseInt(process.env.JUDGE_TIME_LIMIT_MS || '2000');
const MEMORY_LIMIT_MB  = parseInt(process.env.JUDGE_MEMORY_MB     || '256');

console.log('[Judge Worker] Đang chờ bài nộp...');

// ── Xử lý từng job ──────────────────────────────────────────────────────
judgeQueue.process(
  2, // Xử lý tối đa 2 job đồng thời
  async (job) => {
    const { submissionId, boardParticipantId, examId, questId } = job.data;
    console.log(`[Judge] Bắt đầu: ${submissionId} | Participant: ${boardParticipantId}`);

    // ── 1. Đánh dấu đang chấm ────────────────────────────────────────
    await db.query(
      `UPDATE submissions SET status = 'judging' WHERE id = $1`,
      [submissionId]
    );

    // ── 2. Tải file .sb3 từ Supabase Storage ──────────────────────────
    const { rows: subRows } = await db.query(
      'SELECT storage_path FROM submissions WHERE id = $1',
      [submissionId]
    );
    if (!subRows.length) throw new Error(`Không tìm thấy submission: ${submissionId}`);
    
    const storagePath = subRows[0].storage_path;
    const { data: sb3Data, error: downloadError } = await db.supabase.storage
      .from('submissions')
      .download(storagePath);

    if (downloadError) {
      throw new Error(`Lỗi tải bài nộp từ Storage: ${downloadError.message}`);
    }

    const sb3Buffer = Buffer.from(await sb3Data.arrayBuffer());

    // ── 3. Tải testcase từ bảng EXAMS ──────────────────────────────────
    // Lưu ý: questId trong submissions match với id trong quest_data của exam
    const { rows: examRows } = await db.query(
      'SELECT quest_data FROM exams WHERE id = $1',
      [examId]
    );
    if (!examRows.length) throw new Error(`Không tìm thấy đề thi: ${examId}`);
    
    const quests = examRows[0].quest_data;
    const currentQuest = quests.find(q => q.id === questId || q.problem_id === questId);
    
    if (!currentQuest) {
      throw new Error(`Không tìm thấy câu hỏi ${questId} trong đề thi ${examId}`);
    }

    const testCases  = currentQuest.test_cases || [];
    const structuralChecks = currentQuest.structural_checks || [];
    const totalScore = (testCases.reduce((s, t) => s + (t.weight || 10), 0)) + 
                       (structuralChecks.reduce((s, r) => s + (r.weight || 10), 0));
    
    const log        = [];
    let   score      = 0;
    let   finalStatus = 'wrong';

    // ── 4. Phân tích cấu trúc (Structural Analysis - STATIC) ──────────
    if (structuralChecks.length > 0) {
      console.log(`[Judge] Chạy ${structuralChecks.length} kiểm tra cấu trúc...`);
      const structResult = await ScratchAnalyzer.analyze(sb3Buffer, structuralChecks);
      score += structResult.score;
      
      structResult.results.forEach(r => {
        log.push({
          type: 'structural',
          description: r.description,
          passed: r.passed,
          weight: r.weight,
          score: r.score
        });
      });
    }

    // ── 5. Chạy từng testcase (Execution - DYNAMIC) ──────────────────
    for (let i = 0; i < testCases.length; i++) {
      const tc     = testCases[i];
      const tcName = `Testcase ${i + 1}`;

      let result;
      try {
        result = await ScratchRunner.run({
          sb3Buffer,
          input:       tc.input,
          expected:    tc.expected,
          timeLimitMs: currentQuest.time_limit_ms || TIME_LIMIT_MS,
          memLimitMB:  MEMORY_LIMIT_MB,
        });
      } catch (err) {
        result = { passed: false, status: 'error', output: [], error: err.message, ms: 0 };
      }

      const passed = result.passed;
      if (passed) score += (tc.weight || 10);

      log.push({
        type:     'algorithmic',
        index:    i + 1,
        weight:   tc.weight || 10,
        passed,
        status:   result.status,
        output:   result.output?.slice(0, 20),
        expected: tc.expected?.slice(0, 20),
        ms:       result.ms,
      });

      console.log(`[Judge]   ${tcName}: ${passed ? '✅' : '❌'} (${result.ms}ms, ${result.status})`);
      await job.progress(Math.round(((i + 1) / (testCases.length + (structuralChecks.length ? 1 : 0))) * 100));
    }

    // ── 5. Tổng hợp kết quả ──────────────────────────────────────────
    const hasAnyTLE   = log.some(l => l.status === 'tle');
    const hasAnyError = log.some(l => l.status === 'error');

    if (score === totalScore && totalScore > 0) finalStatus = 'accepted';
    else if (score > 0)                         finalStatus = 'partial';
    else if (hasAnyTLE)                         finalStatus = 'tle';
    else if (hasAnyError)                       finalStatus = 'error';
    else                                        finalStatus = 'wrong';

    // Cập nhật kết quả cuối cùng
    await db.query(
      `UPDATE submissions
       SET score = $1, status = $2, judge_log = $3, test_results = $3, judged_at = NOW()
       WHERE id = $4`,
      [score, finalStatus, JSON.stringify(log), submissionId]
    );

    console.log(`[Judge] Hoàn thành: ${submissionId} → ${score}đ (${finalStatus})`);
    return { score, totalScore, status: finalStatus, log };
  }
);

// ── Xử lý worker bị crash ────────────────────────────────────────────────
process.on('uncaughtException',  err => console.error('[Worker] Uncaught:', err));
process.on('unhandledRejection', err => console.error('[Worker] Unhandled:', err));
