/**
 * gui-cleanup.patch.js
 * 
 * Áp dụng vào: src/components/gui/gui.jsx (TurboWarp scratch-gui)
 * Mục đích: Ẩn các UI component không cần thiết trong phòng thi
 * 
 * Cách dùng: Tìm từng đoạn JSX tương ứng và thêm điều kiện render
 */

// ── 1. Ẩn nút thêm Sprite mới ────────────────────────────────────────────
// Tìm trong SpriteSelector component:
// File: src/components/sprite-selector/sprite-selector.jsx
//
// TRƯỚC:
//   <ActionMenu ... items={[...spriteActions]} />
//
// SAU:
//   {!window.CONTEST_MODE && <ActionMenu ... items={[...spriteActions]} />}

// ── 2. Ẩn tab Sound Editor ───────────────────────────────────────────────
// File: src/components/target-pane/target-pane.jsx
//
// TRƯỚC:
//   <TabPanel>  <SoundTab />  </TabPanel>
//
// SAU:
//   {!window.CONTEST_MODE && <TabPanel><SoundTab /></TabPanel>}

// ── 3. Ẩn nút chia sẻ / See Project Page ────────────────────────────────
// File: src/components/menu-bar/menu-bar.jsx
//
// Tìm ShareButton và bọc điều kiện:
//   {!window.CONTEST_MODE && <ShareButton />}

// ── 4. Inject Contest Mode flag vào HTML ─────────────────────────────────
// File: public/index.html (hoặc src/playground/index.ejs)
//
// Thêm vào <head>:
const INDEX_HTML_INJECT = `
<script>
  // Bật Contest Mode: ẩn các tính năng không cần thiết
  window.CONTEST_MODE = true;
  
  // Chặn phím tắt DevTools
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) {
      e.preventDefault(); return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
  });
  
  // Chặn chuột phải
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); return false;
  });
</script>
`;

// ── 5. Thêm Contest Header (đồng hồ + điểm) ─────────────────────────────
// Tạo file mới: src/components/contest-header/contest-header.jsx
const CONTEST_HEADER_JSX = `
import React from 'react';
import styles from './contest-header.css';

const ContestHeader = ({ timeLeft, score, totalScore, studentName, problemTitle }) => (
  <div className={styles.header}>
    <div className={styles.student}>
      <span className={styles.label}>Thí sinh:</span>
      <span className={styles.value}>{studentName}</span>
    </div>
    <div className={styles.problem}>
      <span className={styles.label}>Đề:</span>
      <span className={styles.value}>{problemTitle}</span>
    </div>
    <div className={styles.score}>
      <span className={styles.label}>Điểm:</span>
      <span className={styles.value}>{score}/{totalScore}</span>
    </div>
    <div className={[styles.timer, timeLeft <= 10 ? styles.danger : ''].join(' ')}>
      <span className={styles.label}>Còn lại:</span>
      <span className={styles.value}>{timeLeft}s</span>
    </div>
  </div>
);

export default ContestHeader;
`;

const CONTEST_HEADER_CSS = `
.header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 20px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: monospace;
  font-size: 14px;
  border-bottom: 2px solid #313244;
}
.label { color: #6c7086; margin-right: 4px; }
.value { font-weight: bold; color: #cba6f7; }
.timer .value { color: #a6e3a1; }
.timer.danger .value { color: #f38ba8; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0.4; } }
`;

module.exports = { INDEX_HTML_INJECT, CONTEST_HEADER_JSX, CONTEST_HEADER_CSS };
