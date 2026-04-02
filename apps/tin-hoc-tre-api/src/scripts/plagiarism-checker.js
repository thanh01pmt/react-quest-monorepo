/**
 * src/scripts/plagiarism-checker.js
 * 
 * Phân tích đạo văn (Plagiarism Detection) dựa trên cấu trúc khối lệnh .sb3
 * Chạy CLI: node src/scripts/plagiarism-checker.js --problem <id>
 */

'use strict';

const AdmZip  = require('adm-zip');
const db      = require('@tin-hoc-tre/shared');

const DEFAULT_THRESHOLD = 0.80; // 80% similarity → cảnh báo

// ── Trích xuất fingerprint từ file .sb3 ─────────────────────────────────
function extractFingerprint(sb3Buffer) {
  const zip         = new AdmZip(sb3Buffer);
  const projectJson = JSON.parse(zip.readAsText('project.json'));

  const tokens = [];

  // Duyệt tất cả sprites + stage
  const targets = projectJson.targets || [];
  for (const target of targets) {
    const blocks = target.blocks || {};

    for (const blockId of Object.keys(blocks)) {
      const block = blocks[blockId];
      if (typeof block !== 'object' || !block.opcode) continue;

      // Fingerprint gồm: opcode (loại lệnh) + thứ tự các input type
      // KHÔNG bao gồm giá trị literal (tên biến, số, chuỗi cụ thể)
      let token = block.opcode;

      // Thêm kiểu các input (data type, không phải giá trị)
      if (block.inputs) {
        const inputTypes = Object.keys(block.inputs).sort().map(key => {
          const input = block.inputs[key];
          // Input[1] là shadow block, input[2] là actual
          const actualInput = input[2] || input[1];
          if (Array.isArray(actualInput)) {
            return `I${actualInput[0]}`; // Primitive type code
          }
          return 'B'; // Block reference
        });
        token += `(${inputTypes.join(',')})`;
      }

      // Thêm các fields (loại field, không phải giá trị)
      if (block.fields) {
        const fieldKeys = Object.keys(block.fields).sort();
        if (fieldKeys.length) token += `[${fieldKeys.join(',')}]`;
      }

      tokens.push(token);
    }
  }

  return tokens;
}

// ── Tính Jaccard Similarity giữa 2 tập token ────────────────────────────
function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

// ── Tính Shingling similarity (n-gram) — chính xác hơn Jaccard thuần ────
function shingleSimilarity(tokensA, tokensB, n = 3) {
  function getShingles(tokens) {
    const shingles = new Set();
    for (let i = 0; i <= tokens.length - n; i++) {
      shingles.add(tokens.slice(i, i + n).join('→'));
    }
    return shingles;
  }

  const shA = getShingles(tokensA);
  const shB = getShingles(tokensB);

  let intersection = 0;
  for (const s of shA) {
    if (shB.has(s)) intersection++;
  }

  const union = shA.size + shB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

// ── Main: chạy kiểm tra đạo văn cho 1 đề thi ────────────────────────────
async function checkPlagiarism(problemId, threshold = DEFAULT_THRESHOLD) {
  console.log(`\n[Plagiarism] Kiểm tra đề: ${problemId} (ngưỡng: ${threshold * 100}%)`);

  // Lấy tất cả bài nộp tốt nhất của mỗi thí sinh
  const { rows } = await db.query(`
    SELECT DISTINCT ON (user_id)
      s.id AS submission_id,
      s.user_id,
      u.full_name,
      u.school,
      s.score,
      s.sb3_data
    FROM submissions s
    JOIN users u ON u.id = s.user_id
    WHERE s.problem_id = $1
      AND s.status IN ('accepted', 'partial')
    ORDER BY user_id, score DESC
  `, [problemId]);

  if (rows.length < 2) {
    console.log('[Plagiarism] Không đủ bài để so sánh (<2).');
    return [];
  }

  console.log(`[Plagiarism] Phân tích ${rows.length} bài nộp...`);

  // Trích fingerprint cho tất cả
  const fingerprints = rows.map(row => ({
    submissionId: row.submission_id,
    userId:       row.user_id,
    fullName:     row.full_name,
    school:       row.school,
    score:        row.score,
    tokens:       extractFingerprint(row.sb3_data),
  }));

  const suspicious = [];

  // So sánh từng cặp O(n²)
  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const a = fingerprints[i];
      const b = fingerprints[j];

      const jaccard  = jaccardSimilarity(a.tokens, b.tokens);
      const shingle  = shingleSimilarity(a.tokens, b.tokens);
      const combined = (jaccard * 0.4 + shingle * 0.6); // Trọng số shingle cao hơn

      if (combined >= threshold) {
        const pair = {
          student_a: { name: a.fullName, school: a.school, score: a.score, id: a.submissionId },
          student_b: { name: b.fullName, school: b.school, score: b.score, id: b.submissionId },
          jaccard_similarity:  Math.round(jaccard  * 1000) / 1000,
          shingle_similarity:  Math.round(shingle  * 1000) / 1000,
          combined_similarity: Math.round(combined * 1000) / 1000,
          severity: combined >= 0.95 ? 'HIGH' : combined >= 0.85 ? 'MEDIUM' : 'LOW',
        };
        suspicious.push(pair);
        console.log(
          `  ⚠️  [${pair.severity}] ${a.fullName} ↔ ${b.fullName}: ${(combined * 100).toFixed(1)}%`
        );
      }
    }
  }

  if (!suspicious.length) {
    console.log('[Plagiarism] ✅ Không phát hiện đạo văn đáng ngờ.');
  } else {
    console.log(`\n[Plagiarism] ⚠️  Tổng cộng ${suspicious.length} cặp đáng ngờ.`);
    console.log('[Plagiarism] Kết quả đầy đủ (JSON):');
    console.log(JSON.stringify(suspicious, null, 2));
  }

  return suspicious;
}

// ── CLI interface ────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const problemIdx   = args.indexOf('--problem');
  const thresholdIdx = args.indexOf('--threshold');

  const problemId = problemIdx  !== -1 ? args[problemIdx  + 1] : null;
  const threshold = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1]) : DEFAULT_THRESHOLD;

  if (!problemId) {
    console.error('Dùng: node plagiarism-checker.js --problem <id> [--threshold 0.85]');
    process.exit(1);
  }

  checkPlagiarism(problemId, threshold)
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { checkPlagiarism, extractFingerprint, jaccardSimilarity, shingleSimilarity };
