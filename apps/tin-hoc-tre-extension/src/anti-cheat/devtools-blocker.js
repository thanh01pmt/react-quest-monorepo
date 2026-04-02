/**
 * anti-cheat/devtools-blocker.js
 * 
 * Script nhúng vào <head> của trang thi.
 * Ngăn chặn:
 *   1. Phím tắt mở DevTools (F12, Ctrl+Shift+I, ...)
 *   2. Chuột phải (context menu)
 *   3. Kéo cửa sổ DevTools ra ngoài (phát hiện qua viewport resize)
 *   4. Breakpoint debugger trick
 * 
 * QUAN TRỌNG: Đây chỉ là lớp răn đe, không phải lớp bảo mật chính.
 *             Bảo mật thực sự nằm ở Headless Judge (phần C).
 */

(function() {
  'use strict';

  // ── 1. Chặn phím tắt mở DevTools ──────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+Shift+I (Elements), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspector)
    if (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+S (Save — tránh thí sinh lưu source về máy)
    if (e.ctrlKey && e.keyCode === 83) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, true); // capture phase để bắt trước Scratch

  // ── 2. Chặn chuột phải ────────────────────────────────────────────────
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); return false;
  }, true);

  // ── 3. Phát hiện DevTools mở qua kích thước cửa sổ ───────────────────
  const DEVTOOLS_THRESHOLD = 160; // px

  function isDevToolsOpen() {
    const widthGap  = window.outerWidth  - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    return widthGap > DEVTOOLS_THRESHOLD || heightGap > DEVTOOLS_THRESHOLD;
  }

  let devtoolsWarningCount = 0;
  const devtoolsChecker = setInterval(function() {
    if (isDevToolsOpen()) {
      devtoolsWarningCount++;
      console.clear();

      if (devtoolsWarningCount === 1) {
        // Cảnh báo lần 1: thông báo thân thiện
        showOverlay('⚠️ Cảnh báo', 'Không được sử dụng công cụ dành cho nhà phát triển trong phòng thi. Hành vi này sẽ bị ghi nhận.');
      } else if (devtoolsWarningCount >= 3) {
        // Lần 3+: khóa màn hình và ghi log
        showOverlay('🔒 Bị khoá', 'Bạn đã vi phạm quy chế thi. Màn hình bị khoá. Vui lòng gọi giám thị.');
        logViolation('devtools_open', { count: devtoolsWarningCount });
        clearInterval(devtoolsChecker);
      }
    }
  }, 1000);

  // ── 4. Debugger breakpoint trick (làm chậm môi trường nếu dùng debugger)
  // Kỹ thuật: setInterval với debugger statement làm phát hiện nếu DevTools dừng execution
  let lastTime = Date.now();
  setInterval(function() {
    // eslint-disable-next-line no-debugger
    debugger; // Nếu DevTools đang break here, thời gian sẽ lệch lớn
    const now = Date.now();
    if (now - lastTime > 200) {
      // Thời gian lệch > 200ms → có khả năng đang dùng debugger
      logViolation('debugger_detected', { gap: now - lastTime });
    }
    lastTime = now;
  }, 100);

  // ── 5. Chặn copy-paste code từ bên ngoài ─────────────────────────────
  // Cho phép copy-paste trong chính editor, nhưng log khi paste từ clipboard ngoài
  document.addEventListener('paste', function(e) {
    const target = e.target;
    // Nếu paste không vào trong Scratch editor → log
    if (!target.closest('.scratch-gui, .blocklyDiv, [class*="scratch"]')) {
      logViolation('external_paste', { target: target.tagName });
    }
  });

  // ── Helper: Hiển thị overlay cảnh báo ────────────────────────────────
  function showOverlay(title, message) {
    // Xóa overlay cũ nếu có
    const old = document.getElementById('contest-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'contest-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85); z-index: 999999;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: sans-serif; color: white; text-align: center; padding: 40px;
    `;
    overlay.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">${title.split(' ')[0]}</div>
      <h2 style="font-size:24px;margin-bottom:12px;">${title}</h2>
      <p style="font-size:16px;color:#ccc;max-width:400px;">${message}</p>
    `;
    document.body.appendChild(overlay);
  }

  // ── Helper: Gửi log vi phạm lên server ───────────────────────────────
  async function logViolation(type, data) {
    try {
      const token = localStorage.getItem('contest_token') || '';
      await fetch('/api/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, data, timestamp: Date.now() }),
      });
    } catch (_) {
      // Silent fail — không để lỗi network làm hỏng trải nghiệm thi
    }
  }

})();
