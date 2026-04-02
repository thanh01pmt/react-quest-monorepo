/**
 * backend/judge/scratch-runner.js
 * 
 * Lớp lõi: chạy file .sb3 trong scratch-vm headless (không có trình duyệt),
 * tiêm dữ liệu input, giám sát timeout/memory, và trích xuất output.
 * 
 * Yêu cầu:
 *   npm install scratch-vm jsdom canvas adm-zip
 * 
 * Lưu ý: scratch-vm cần môi trường giả lập DOM tối thiểu.
 *   jsdom cung cấp window, document đủ để VM khởi động.
 */

'use strict';

// ── Giả lập môi trường DOM tối thiểu cho scratch-vm ────────────────────
const { JSDOM }     = require('jsdom');
const { window: W } = new JSDOM('', { pretendToBeVisual: true });
global.window       = W;
global.document     = W.document;
global.navigator    = W.navigator;
global.self         = W;
global.HTMLElement  = W.HTMLElement;
global.Image        = class Image { set src(_){} };  // Stub cho asset loading

// ── Import scratch-vm SAU khi set global ────────────────────────────────
const VirtualMachine = require('scratch-vm');
const AdmZip         = require('adm-zip');

const TICK_INTERVAL_MS  = 1000 / 30; // 30 FPS chuẩn Scratch
const MAX_OUTPUT_LENGTH = 1000;       // Tránh output tràn bộ nhớ

class ScratchRunner {
  /**
   * Chạy một bài nộp .sb3 với bộ testcase đã cho.
   * 
   * @param {Object} opts
   * @param {Buffer}   opts.sb3Buffer    - File .sb3 dạng Buffer
   * @param {string[]} opts.input        - Mảng dữ liệu đầu vào
   * @param {string[]} opts.expected     - Mảng đáp án kỳ vọng
   * @param {number}   opts.timeLimitMs  - Giới hạn thời gian (ms)
   * @param {number}   [opts.memLimitMB] - Giới hạn bộ nhớ (MB, dùng process monitor)
   * @returns {Promise<{passed, status, output, ms}>}
   */
  static async run({ sb3Buffer, input, expected, timeLimitMs = 5000 }) {
    const startMs = Date.now();
    let   vm      = null;

    return new Promise(async (resolve) => {
      let settled   = false;
      let tickCount = 0;

      const finish = (status, output) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutHandle);

        // Dọn dẹp VM
        try { vm.stopAll(); } catch (_) {}
        try { vm.runtime.quit(); } catch (_) {}

        const ms     = Date.now() - startMs;
        const passed = status === 'ok' && compareOutput(output, expected);
        resolve({ passed, status, output, ms });
      };

      // ── Timeout guard ────────────────────────────────────────────────
      const timeoutHandle = setTimeout(() => {
        const output = getListValue(vm, 'output');
        finish('tle', output);
      }, timeLimitMs + 200); // +200ms buffer cho overhead

      try {
        // ── 1. Khởi tạo VM mới ────────────────────────────────────────
        vm = new VirtualMachine();
        vm.setTurboMode(true); // Tối đa tốc độ cho chấm thuật toán

        // ── 2. Parse và load file .sb3 ────────────────────────────────
        await loadSb3(vm, sb3Buffer);

        // ── 3. Tiêm inputData ─────────────────────────────────────────
        setListValue(vm, 'inputData', input.map(String));
        setListValue(vm, 'output', []);
        setListValue(vm, 'expected', expected.map(String));

        // ── 4. Lắng nghe khi dự án kết thúc ──────────────────────────
        vm.runtime.on('PROJECT_STOP_ALL', () => {
          const output = getListValue(vm, 'output');
          finish('ok', output);
        });

        // ── 5. Theo dõi output đủ phần tử ────────────────────────────
        // Cứ mỗi tick, kiểm tra nếu output đã đủ → kết thúc sớm
        vm.runtime.on('AFTER_EXECUTE', () => {
          tickCount++;
          const output = getListValue(vm, 'output');

          // Output đủ phần tử và đúng → kết thúc sớm (tối ưu thời gian)
          if (output.length >= expected.length) {
            finish('ok', output);
            return;
          }

          // Ngăn vòng lặp vô hạn: nếu tick > giới hạn vật lý → TLE
          const elapsedMs = Date.now() - startMs;
          if (elapsedMs > timeLimitMs) {
            finish('tle', output);
          }
        });

        // ── 6. Kiểm tra output quá lớn (chống DOS) ───────────────────
        vm.runtime.on('AFTER_EXECUTE', () => {
          const output = getListValue(vm, 'output');
          if (output.length > MAX_OUTPUT_LENGTH) {
            finish('error', output.slice(0, MAX_OUTPUT_LENGTH));
          }
        });

        // ── 7. Bắt đầu! ──────────────────────────────────────────────
        vm.start();
        vm.greenFlag();

      } catch (err) {
        console.error('[ScratchRunner] Lỗi khởi động VM:', err.message);
        finish('error', []);
      }
    });
  }
}

// ── Helper: Load file .sb3 vào VM ───────────────────────────────────────
async function loadSb3(vm, sb3Buffer) {
  // .sb3 là ZIP chứa project.json + assets
  const zip         = new AdmZip(sb3Buffer);
  const projectJson = zip.readAsText('project.json');

  if (!projectJson) {
    throw new Error('File .sb3 không chứa project.json hợp lệ.');
  }

  // Tạo object giả lập để VM load project từ JSON string
  await vm.loadProject(JSON.parse(projectJson));
}

// ── Helper: Ghi giá trị vào danh sách Scratch ───────────────────────────
function setListValue(vm, listName, arr) {
  const stage = vm.runtime.getTargetForStage();
  if (!stage) return;

  const list = stage.lookupVariableByNameAndType(listName, 'list');
  if (list) {
    list.value = arr;
  } else {
    // Tự tạo list nếu chưa tồn tại (phòng trường hợp thí sinh quên tạo)
    const id = `auto_${listName}_${Date.now()}`;
    stage.variables[id] = {
      id, name: listName, type: 'list', value: arr, _monitorUpToDate: false,
    };
  }
}

// ── Helper: Đọc giá trị danh sách Scratch ───────────────────────────────
function getListValue(vm, listName) {
  try {
    const stage = vm.runtime.getTargetForStage();
    if (!stage) return [];
    const list = stage.lookupVariableByNameAndType(listName, 'list');
    return list ? [...list.value] : [];
  } catch {
    return [];
  }
}

// ── Helper: So sánh output vs expected (với tolerance cho số thực) ───────
function compareOutput(output, expected) {
  if (output.length !== expected.length) return false;

  for (let i = 0; i < expected.length; i++) {
    const got = String(output[i]).trim();
    const exp = String(expected[i]).trim();

    if (got === exp) continue;

    // Cho phép sai số ±0.01 với số thực (tránh floating point rounding)
    const numGot = parseFloat(got);
    const numExp = parseFloat(exp);
    if (!isNaN(numGot) && !isNaN(numExp) && Math.abs(numGot - numExp) <= 0.01) continue;

    return false;
  }
  return true;
}

module.exports = { ScratchRunner };
