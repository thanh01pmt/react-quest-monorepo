/**
 * portal/contest-portal.js
 * ════════════════════════════════════════════════════════════════
 * Logic chính của Contest Portal:
 *  • Khởi tạo: đọc URL params → tải đề → render sidebar
 *  • Test:   gọi CONTEST_BRIDGE.runTests() → cập nhật UI per-TC
 *  • Submit: export .sb3 → POST API → poll → hiển thị kết quả modal
 *  • Timer:  đếm ngược thời gian thi
 * ════════════════════════════════════════════════════════════════
 */

'use strict';

// ── Cấu hình từ URL: ?problem=bai1&token=xxx&name=NguyenVanA ────────────
const params    = new URLSearchParams(location.search);
const PROBLEM_ID = params.get('problem') || 'bai1';
const API_BASE   = window.CONTEST_API || '/api';
const TOKEN      = params.get('token') || localStorage.getItem('contest_token') || '';
const STUDENT    = decodeURIComponent(params.get('name') || localStorage.getItem('contest_student') || 'Thí sinh');

// Giới hạn thời gian thi (giây) — server có thể ghi đè khi tải đề
let CONTEST_DURATION_SEC = 60 * 60; // 60 phút mặc định
let contestStartEpoch    = Date.now();
let timerInterval        = null;
let bridge               = null;    // CONTEST_BRIDGE từ TurboWarp iframe
let currentProblem       = null;
let submissions          = [];      // Lịch sử nộp bài

// ── Refs DOM ─────────────────────────────────────────────────────────────
const iframe       = document.getElementById('tw-iframe');
const btnTest      = document.getElementById('btn-test');
const btnSubmit    = document.getElementById('btn-submit');
const tcList       = document.getElementById('tc-list');
const tcSummary    = document.getElementById('tc-summary');
const subList      = document.getElementById('sub-list');
const timerBox     = document.getElementById('timer-box');
const timerVal     = document.getElementById('timer-value');
const hdrTitle     = document.getElementById('hdr-title');
const hdrStudent   = document.getElementById('hdr-student');
const hdrBestScore = document.getElementById('hdr-best-score');
const editorOverlay= document.getElementById('editor-overlay');
const overlayMsg   = document.getElementById('overlay-msg');
const modalBackdrop= document.getElementById('modal-backdrop');
const modalIcon    = document.getElementById('modal-icon');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalClose   = document.getElementById('modal-close');
const modalViewBoard = document.getElementById('modal-view-board');

// ════════════════════════════════════════════════════════════════
// KHỞI TẠO
// ════════════════════════════════════════════════════════════════

async function init() {
  hdrStudent.textContent = STUDENT;
  if (TOKEN) localStorage.setItem('contest_token', TOKEN);

  // 1. Đợi TurboWarp iframe load xong và CONTEST_BRIDGE sẵn sàng
  bridge = await waitForBridge();
  console.log('[Portal] CONTEST_BRIDGE sẵn sàng.');

  // 2. Tải đề thi
  currentProblem = await bridge.getProblem(PROBLEM_ID);
  if (!currentProblem) {
    showError('Không tải được đề thi. Vui lòng tải lại trang.');
    return;
  }

  // 3. Render đề bài
  renderProblem(currentProblem);

  // 4. Render danh sách TC chờ
  renderTcPending(currentProblem.test_cases);

  // 5. Bật nút
  btnTest.disabled   = false;
  btnSubmit.disabled = false;

  // 6. Bắt đầu đồng hồ thi
  CONTEST_DURATION_SEC = (currentProblem.time_limit || 30) * 60; // đề tính bằng phút thi
  contestStartEpoch    = Date.now();
  startTimer();

  // 7. Tải lịch sử nộp bài
  loadSubmissions();
}

// ── Đợi bridge sẵn sàng (iframe cần load + extension cần đăng ký) ────────
function waitForBridge(timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    function check() {
      const win = iframe.contentWindow;
      if (win && win.CONTEST_BRIDGE) {
        resolve(win.CONTEST_BRIDGE);
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error('Timeout: TurboWarp không phản hồi. Hãy tải lại trang.'));
        return;
      }
      setTimeout(check, 200);
    }

    // Lắng nghe cả postMessage từ iframe (phòng khi cross-origin)
    window.addEventListener('message', function handler(e) {
      if (e.data?.source === 'CONTEST_BRIDGE' && e.data?.type === 'BRIDGE_READY') {
        window.removeEventListener('message', handler);
        // Thêm 100ms để class khởi tạo xong
        setTimeout(() => resolve(iframe.contentWindow?.CONTEST_BRIDGE), 100);
      }
    });

    iframe.addEventListener('load', () => setTimeout(check, 500));
    check();
  });
}

// ════════════════════════════════════════════════════════════════
// TEST FLOW
// ════════════════════════════════════════════════════════════════

btnTest.addEventListener('click', async () => {
  if (!bridge || !currentProblem) return;

  // UI: khóa nút, hiện overlay editor
  setTestingMode(true);
  resetTcResults(currentProblem.test_cases);

  try {
    await bridge.runTests(PROBLEM_ID, onTcProgress);
  } catch (err) {
    console.error('[Portal] Lỗi khi chạy test:', err);
    showError('Có lỗi khi chạy test: ' + err.message);
  } finally {
    setTestingMode(false);
  }
});

/**
 * Callback được gọi sau mỗi testcase (hoặc khi bắt đầu chạy).
 */
function onTcProgress(result) {
  const card = document.getElementById(`tc-card-${result.index}`);
  if (!card) return;

  const badge = card.querySelector('.tc-badge');
  const meta  = card.querySelector('.tc-meta-ms');
  const detail = card.querySelector('.tc-detail');

  // Cập nhật badge + class
  card.className = `tc-card ${result.status}`;
  badge.className = `tc-badge ${result.status}`;
  badge.textContent = labelForStatus(result.status);

  if (meta && result.ms !== undefined) {
    meta.textContent = `${result.ms}ms`;
  }

  // Hiển thị detail khi sai/TLE
  if (detail && (result.status === 'fail' || result.status === 'tle')) {
    detail.querySelector('.tc-got-val').textContent  = formatList(result.output);
    detail.querySelector('.tc-exp-val').textContent  = formatList(result.expected);
  }

  // Cuộn đến card đang chạy
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Cập nhật summary sau khi xong
  if (result.status !== 'running') updateTcSummary();
}

function updateTcSummary() {
  const cards   = tcList.querySelectorAll('.tc-card');
  let pass = 0, total = 0, score = 0, maxScore = 0;

  cards.forEach(c => {
    const w = parseInt(c.dataset.weight) || 10;
    maxScore += w;
    total++;
    if (c.classList.contains('pass')) { pass++; score += w; }
  });

  if (total === 0) return;
  const done = [...cards].every(c => !c.classList.contains('pending') && !c.classList.contains('running'));
  if (!done) return;

  tcSummary.hidden = false;
  tcSummary.querySelector('span').textContent =
    `Kết quả: ${pass}/${total} testcase đúng — ${score}/${maxScore} điểm (client)`;
  tcSummary.style.color = pass === total ? '#4ade80' : pass > 0 ? '#fbbf24' : '#f87171';
  switchTab('results');
}

// ════════════════════════════════════════════════════════════════
// SUBMIT FLOW
// ════════════════════════════════════════════════════════════════

btnSubmit.addEventListener('click', async () => {
  if (!bridge) return;

  // Xác nhận trước khi nộp
  if (!confirm(`Xác nhận nộp bài cho đề "${currentProblem?.title || PROBLEM_ID}"?`)) return;

  btnSubmit.disabled = true;
  showModal('⏳', 'Đang xuất file bài làm...', '<div class="judge-progress"><div class="spinner"></div><p>Đang xuất .sb3 từ trình soạn thảo...</p></div>');

  let ab;
  try {
    ab = await bridge.exportSb3();
  } catch (err) {
    showModal('❌', 'Lỗi xuất file', `<p>Không xuất được file .sb3: ${err.message}</p>`);
    modalClose.hidden = false;
    btnSubmit.disabled = false;
    return;
  }

  // Kiểm tra magic bytes ZIP
  const header = new Uint8Array(ab.slice(0, 4));
  if (header[0] !== 0x50 || header[1] !== 0x4B) {
    showModal('❌', 'File không hợp lệ', '<p>File .sb3 xuất ra không đúng định dạng. Hãy thử lưu dự án trước rồi nộp lại.</p>');
    modalClose.hidden = false;
    btnSubmit.disabled = false;
    return;
  }

  showModal('📤', 'Đang nộp bài...', '<div class="judge-progress"><div class="spinner"></div><p>Đang tải lên máy chủ...</p></div>');

  // POST lên server
  let submissionId;
  try {
    const fd = new FormData();
    fd.append('sb3file', new Blob([ab], { type: 'application/zip' }), 'project.sb3');
    fd.append('problem_id', PROBLEM_ID);

    const res = await fetch(`${API_BASE}/submit`, {
      method:  'POST',
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      body:    fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
      throw new Error(err.error);
    }

    const data = await res.json();
    submissionId = data.submission_id;
  } catch (err) {
    showModal('❌', 'Nộp bài thất bại', `<p>${err.message}</p>`);
    modalClose.hidden = false;
    btnSubmit.disabled = false;
    return;
  }

  // Bắt đầu poll kết quả
  showModal('⚙️', 'Máy chấm đang xử lý', buildJudgingBody(submissionId));
  pollSubmission(submissionId);
});

/**
 * Poll kết quả từ server mỗi 2 giây cho đến khi có kết quả.
 */
async function pollSubmission(submissionId, attempts = 0) {
  if (attempts > 90) { // Timeout sau 3 phút poll
    showModal('⏱️', 'Máy chấm không phản hồi', '<p>Máy chấm mất quá lâu. Kết quả sẽ cập nhật ở tab "Lần nộp" sau.</p>');
    modalClose.hidden = false;
    btnSubmit.disabled = false;
    return;
  }

  await sleep(2000);

  try {
    const res  = await fetch(`${API_BASE}/submit/${submissionId}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });
    const data = await res.json();

    if (data.status === 'pending' || data.status === 'judging') {
      pollSubmission(submissionId, attempts + 1);
      return;
    }

    // Có kết quả → hiển thị
    onJudgeDone(data);
    submissions.unshift(data);
    renderSubmissions();
    updateBestScore();

  } catch (err) {
    console.warn('[Portal] Poll lỗi, thử lại:', err.message);
    pollSubmission(submissionId, attempts + 1);
  }
}

function onJudgeDone(data) {
  const score   = data.score || 0;
  const total   = data.total_score || 100;
  const pct     = Math.round((score / total) * 100);
  const isPass  = data.status === 'accepted';
  const isPartial = data.status === 'partial';

  const icon  = isPass ? '✅' : isPartial ? '🟡' : '❌';
  const title = isPass ? 'Chấp nhận!' : isPartial ? 'Một phần đúng' : 'Sai';

  // Render grid testcase từ judge_log
  let gridHtml = '';
  if (data.judge_log && Array.isArray(data.judge_log)) {
    gridHtml = `<div class="judge-tc-grid">` +
      data.judge_log.map(l =>
        `<div class="judge-tc-pill ${l.passed ? 'pass' : l.status === 'tle' ? 'tle' : 'fail'}">
           TC${l.index}<br>${l.passed ? '✓' : l.status === 'tle' ? 'TLE' : '✗'}
         </div>`
      ).join('') +
      `</div>`;
  }

  const body = `
    <div class="final-score">${score}/${total} <span style="font-size:16px;color:var(--text-muted)">điểm (${pct}%)</span></div>
    ${gridHtml}
    <p style="margin-top:10px;font-size:12px;color:var(--text-muted)">
      Đây là kết quả chấm bởi máy chấm độc lập với bộ testcase nâng cao.
      Kết quả được ghi nhận vào bảng xếp hạng.
    </p>
  `;

  showModal(icon, title, body);
  modalClose.hidden     = false;
  modalViewBoard.hidden = false;
  btnSubmit.disabled    = false;
}

// ════════════════════════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════════════════════════

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - contestStartEpoch) / 1000);
    const left    = Math.max(0, CONTEST_DURATION_SEC - elapsed);
    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(left % 60).padStart(2, '0');
    timerVal.textContent = `${mm}:${ss}`;

    timerBox.className = 'timer-box';
    if (left <= 300) timerBox.classList.add('warning');
    if (left <= 60)  timerBox.classList.add('danger');

    if (left === 0) {
      clearInterval(timerInterval);
      btnTest.disabled   = true;
      btnSubmit.disabled = true;
      alert('⏰ Hết giờ! Phiên thi đã kết thúc.');
    }
  }, 1000);
}

// ════════════════════════════════════════════════════════════════
// RENDER HELPERS
// ════════════════════════════════════════════════════════════════

function renderProblem(p) {
  hdrTitle.textContent = p.title || PROBLEM_ID;

  // Tab đề bài
  const descEl = document.getElementById('problem-desc');
  descEl.textContent = p.description || '(Không có mô tả)';

  if (p.example_input || p.example_output) {
    document.getElementById('example-io').hidden = false;
    document.getElementById('example-input').textContent  = formatList(p.example_input) || '—';
    document.getElementById('example-output').textContent = formatList(p.example_output) || '—';
  }
}

function renderTcPending(testCases) {
  tcList.innerHTML = '';
  testCases.forEach((tc, i) => {
    const card = document.createElement('div');
    card.className   = 'tc-card pending';
    card.id          = `tc-card-${i + 1}`;
    card.dataset.weight = tc.weight || 10;
    card.innerHTML = `
      <div class="tc-card-header">
        <span class="tc-card-title">Testcase ${i + 1}</span>
        <span class="tc-badge pending">Chờ</span>
      </div>
      <div class="tc-meta">
        <span class="tc-weight">${tc.weight || 10} điểm</span>
        <span class="tc-meta-ms">—</span>
      </div>
      <div class="tc-detail">
        <div class="tc-detail-row">
          <span class="tc-detail-label">Output:</span>
          <span class="tc-detail-val tc-got-val">—</span>
        </div>
        <div class="tc-detail-row">
          <span class="tc-detail-label">Expected:</span>
          <span class="tc-detail-val expected tc-exp-val">—</span>
        </div>
      </div>
    `;
    tcList.appendChild(card);
  });
}

function resetTcResults(testCases) {
  tcSummary.hidden = true;
  renderTcPending(testCases);
  switchTab('results');
}

function renderSubmissions() {
  subList.innerHTML = '';
  if (!submissions.length) {
    subList.innerHTML = '<p class="tc-empty">Chưa có lần nộp nào.</p>';
    return;
  }
  submissions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'sub-card';
    const scoreClass = s.status === 'accepted' ? 'accepted'
                     : s.status === 'partial'  ? 'partial'
                     : s.status === 'wrong'    ? 'wrong'
                     : 'pending';
    div.innerHTML = `
      <div class="sub-info">
        <span class="sub-id">${String(s.id).slice(0, 8)}…</span>
        <span class="sub-time">${formatTime(s.submitted_at)}</span>
      </div>
      <span class="sub-score ${scoreClass}">${s.score ?? '?'}/${s.total_score ?? '?'}</span>
    `;
    subList.appendChild(div);
  });
}

function updateBestScore() {
  const best = submissions.reduce((m, s) => Math.max(m, s.score || 0), 0);
  const max  = submissions[0]?.total_score || 0;
  hdrBestScore.textContent = max ? `${best}/${max}` : '—';
}

async function loadSubmissions() {
  try {
    const res = await fetch(`${API_BASE}/submit/history/${PROBLEM_ID}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });
    if (!res.ok) return;
    submissions = await res.json();
    renderSubmissions();
    updateBestScore();
  } catch (_) {}
}

// ── Modal helpers ─────────────────────────────────────────────────────────
function showModal(icon, title, bodyHtml) {
  modalIcon.textContent  = icon;
  modalTitle.textContent = title;
  modalBody.innerHTML    = bodyHtml;
  modalClose.hidden      = true;
  modalViewBoard.hidden  = true;
  modalBackdrop.hidden   = false;
}

function buildJudgingBody(submissionId) {
  return `
    <div class="judge-progress">
      <div class="spinner"></div>
      <div>
        <p>Máy chấm đang xử lý bài nộp...</p>
        <p style="margin-top:4px;font-size:11px;color:var(--text-muted)">ID: ${submissionId.slice(0,8)}…</p>
      </div>
    </div>
  `;
}

modalClose.addEventListener('click', () => { modalBackdrop.hidden = true; });
modalViewBoard.addEventListener('click', () => {
  modalBackdrop.hidden = true;
  window.open(`/leaderboard?problem=${PROBLEM_ID}`, '_blank');
});

// ── Tab switching ─────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
}

// ── Testing mode (khóa UI) ────────────────────────────────────────────────
function setTestingMode(on) {
  btnTest.disabled      = on;
  btnSubmit.disabled    = on;
  editorOverlay.hidden  = !on;
  overlayMsg.textContent = on ? 'Đang chạy testcase...' : '';
}

// ── Utility ──────────────────────────────────────────────────────────────
function formatList(arr) {
  if (!arr) return '—';
  if (Array.isArray(arr)) return arr.join(', ');
  return String(arr);
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString('vi-VN');
  } catch { return isoStr; }
}

function labelForStatus(s) {
  return { running: 'Đang chạy', pass: '✓ Đúng', fail: '✗ Sai', tle: 'TLE', error: 'Lỗi', pending: 'Chờ' }[s] || s;
}

function showError(msg) {
  document.getElementById('problem-desc').innerHTML = `<p style="color:var(--danger)">${msg}</p>`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Khởi động ─────────────────────────────────────────────────────────────
init().catch(err => {
  console.error('[Portal] Lỗi khởi tạo:', err);
  showError('Không thể khởi tạo phòng thi: ' + err.message);
});
