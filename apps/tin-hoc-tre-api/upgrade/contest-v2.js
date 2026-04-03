/**
 * extension/contest-v2.js
 * ════════════════════════════════════════════════════════════════
 * TurboWarp Unsandboxed Extension — Tin học trẻ v2
 *
 * Điểm mới so với v1:
 *  • Expose window.CONTEST_BRIDGE để Contest Portal giao tiếp
 *  • runTests()     → chạy testcase client-side, gọi callback per-TC
 *  • exportSb3()    → xuất file .sb3 hiện tại dưới dạng ArrayBuffer
 *  • getProblem()   → lấy metadata đề thi
 *  • postMessage    → phát events về cửa sổ cha (nếu chạy trong iframe)
 * ════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('[TinHocTre] Cần chạy ở chế độ Unsandboxed!');
  }

  const vm      = Scratch.vm;
  const runtime = vm.runtime;

  // ── Hằng số ─────────────────────────────────────────────────────────────
  const API_BASE    = window.CONTEST_API || '/api';
  const POLL_MS     = 50;   // Tần suất kiểm tra output trong VM loop

  // ════════════════════════════════════════════════════════════════════════
  class TinHocTreContest {

    constructor() {
      this._cache    = {};   // Cache dữ liệu đề đã fetch
      this._running  = false;
      this._startMs  = 0;
      this._limitMs  = 60_000;

      this._hookGreenFlag();
      this._startTLEWatcher();

      // Đăng ký CONTEST_BRIDGE trên window của TurboWarp
      // Portal (cha/cùng origin) truy cập qua: iframeEl.contentWindow.CONTEST_BRIDGE
      window.CONTEST_BRIDGE = this._makeBridge();

      // Báo hiệu cho portal biết extension đã sẵn sàng
      this._emit('BRIDGE_READY', {});
    }

    // ════════════════ CONTEST BRIDGE (giao diện công khai) ════════════════

    _makeBridge() {
      const self = this;
      return {
        /**
         * Chạy các testcase mẫu (public) — hoàn toàn client-side.
         *
         * @param {string}   problemId
         * @param {Function} onProgress  - Gọi sau mỗi testcase:
         *   onProgress({ index, total, status, passed, ms, output, expected, weight })
         *   status: 'running' | 'pass' | 'fail' | 'tle' | 'error'
         * @returns {Promise<{ score, total, results[] }>}
         */
        async runTests(problemId, onProgress = () => {}) {
          const problem = await self._fetchProblem(problemId);
          if (!problem) throw new Error(`Không tải được đề: ${problemId}`);

          self._limitMs = (problem.time_limit || 30) * 1000;
          const results = [];
          let score = 0;

          for (let i = 0; i < problem.test_cases.length; i++) {
            const tc    = problem.test_cases[i];
            const total = problem.test_cases.length;

            // Thông báo: đang chạy TC này
            onProgress({ index: i + 1, total, status: 'running', weight: tc.weight || 10 });
            self._emit('TC_RUNNING', { index: i + 1, total });

            const result = await self._runOneTc(tc);
            if (result.passed) score += (tc.weight || 10);

            const payload = {
              index:    i + 1,
              total,
              weight:   tc.weight || 10,
              passed:   result.passed,
              status:   result.status,   // 'pass'|'fail'|'tle'|'error'
              ms:       result.ms,
              output:   result.output,
              expected: tc.expected,
            };

            results.push(payload);
            onProgress(payload);
            self._emit('TC_DONE', payload);
          }

          const summary = {
            score,
            total: problem.test_cases.reduce((s, t) => s + (t.weight || 10), 0),
            results,
          };
          self._emit('TESTS_COMPLETE', summary);
          return summary;
        },

        /**
         * Xuất dự án hiện tại dưới dạng ArrayBuffer (.sb3).
         * Portal dùng cái này để tạo FormData upload lên server.
         *
         * @returns {Promise<ArrayBuffer>}
         */
        async exportSb3() {
          // scratch-vm API chính thức
          const ab = await vm.saveProjectSb3();
          return ab; // ArrayBuffer
        },

        /**
         * Lấy metadata đề thi (đã cache).
         * @returns {Promise<Object|null>}
         */
        async getProblem(problemId) {
          return self._fetchProblem(problemId);
        },

        /**
         * Dừng mọi thứ đang chạy.
         */
        stopAll() {
          vm.stopAll();
          self._running = false;
          self._startMs = 0;
        },
      };
    }

    // ════════════════ CHẠY MỘT TESTCASE ══════════════════════════════════

    async _runOneTc(tc) {
      const limitMs = this._limitMs;
      const startMs = Date.now();

      // 1. Reset state
      this._setList('output', []);
      this._setList('inputData', tc.input.map(String));
      this._setList('expected',  tc.expected.map(String));

      // 2. Phát cờ xanh
      this._startMs = Date.now();
      this._running = true;
      vm.greenFlag();

      // 3. Đợi kết quả (output đủ phần tử HOẶC hết giờ)
      await this._waitOutput(tc.expected.length, limitMs);

      // 4. Dừng VM
      vm.stopAll();
      this._running = false;
      await this._sleep(60);

      // 5. Thu thập kết quả
      const ms     = Date.now() - startMs;
      const output = this._getList('output');
      const timedOut = ms >= limitMs - 100;
      const passed   = !timedOut && this._compare(output, tc.expected);

      let status = 'fail';
      if (timedOut)    status = 'tle';
      else if (passed) status = 'pass';

      return { passed, status, ms, output };
    }

    // ════════════════ HELPERS VM ══════════════════════════════════════════

    _waitOutput(expectedLen, limitMs) {
      return new Promise(resolve => {
        const tick = setInterval(() => {
          const elapsed = Date.now() - this._startMs;
          const out     = this._getList('output');
          if (out.length >= expectedLen || elapsed >= limitMs) {
            clearInterval(tick);
            resolve();
          }
        }, POLL_MS);
      });
    }

    _compare(output, expected) {
      if (output.length !== expected.length) return false;
      for (let i = 0; i < expected.length; i++) {
        const a = String(output[i]).trim();
        const b = String(expected[i]).trim();
        if (a === b) continue;
        // Tolerance ±0.01 cho số thực
        if (!isNaN(+a) && !isNaN(+b) && Math.abs(+a - +b) <= 0.01) continue;
        return false;
      }
      return true;
    }

    _hookGreenFlag() {
      const orig = runtime.requestGreenFlag.bind(runtime);
      runtime.requestGreenFlag = () => {
        this._startMs = Date.now();
        orig();
      };
    }

    _startTLEWatcher() {
      runtime.on('BEFORE_EXECUTE', () => {
        if (!this._running || !this._startMs) return;
        if (Date.now() - this._startMs > this._limitMs + 300) {
          console.warn('[TinHocTre] TLE → stopAll');
          vm.stopAll();
          this._running = false;
        }
      });
    }

    _getStage() { return runtime.getTargetForStage(); }

    _getList(name) {
      const list = this._getStage()?.lookupVariableByNameAndType(name, 'list');
      return list ? [...list.value] : [];
    }

    _setList(name, arr) {
      const list = this._getStage()?.lookupVariableByNameAndType(name, 'list');
      if (list) { list.value = arr; list._monitorUpToDate = false; }
    }

    // ── Fetch đề thi với cache ────────────────────────────────────────────
    async _fetchProblem(id) {
      if (this._cache[id]) return this._cache[id];
      try {
        const token = this._token();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res  = await fetch(`${API_BASE}/problems/${id}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this._cache[id] = await res.json();
        return this._cache[id];
      } catch (err) {
        console.error('[TinHocTre] Lỗi fetch đề:', err.message);
        return null;
      }
    }

    // ── postMessage về cửa sổ cha (portal iframe parent) ─────────────────
    _emit(type, detail) {
      const msg = { source: 'CONTEST_BRIDGE', type, detail };
      // Cùng origin → gửi trực tiếp; cross-origin → dùng '*' (an toàn vì không có secret)
      try { window.parent.postMessage(msg, window.location.origin); } catch (_) {}
      // Cũng dispatch CustomEvent trong cùng window để portal cùng origin bắt được
      window.dispatchEvent(new CustomEvent('contest:' + type, { detail }));
    }

    _token() {
      try { return localStorage.getItem('contest_token') || ''; } catch { return ''; }
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ════════════════ SCRATCH BLOCKS (UI trong editor) ════════════════════

    getInfo() {
      return {
        id: 'tinhocTreContest',
        name: '🏆 Tin học trẻ',
        color1: '#7C3AED', color2: '#5B21B6', color3: '#4C1D95',
        blocks: [
          {
            opcode: 'startContest', blockType: Scratch.BlockType.COMMAND,
            text: 'Bắt đầu đề [PROBLEM_ID]',
            arguments: { PROBLEM_ID: { type: Scratch.ArgumentType.STRING, menu: 'problemMenu', defaultValue: 'bai1' } },
          },
          { blockType: Scratch.BlockType.SEPARATOR },
          { opcode: 'getTimeLeft',  blockType: Scratch.BlockType.REPORTER, text: 'Thời gian còn lại (giây)' },
          { opcode: 'getScore',     blockType: Scratch.BlockType.REPORTER, text: 'Điểm tích lũy' },
          { opcode: 'checkResult',  blockType: Scratch.BlockType.BOOLEAN,  text: 'output khớp expected?' },
          { opcode: 'isTimeUp',     blockType: Scratch.BlockType.BOOLEAN,  text: 'Đã hết giờ?' },
        ],
        menus: {
          problemMenu: {
            acceptReporters: false,
            items: [
              { text: 'Bài 1 – Tìm lớn nhất',      value: 'bai1' },
              { text: 'Bài 2 – Robot đi theo lệnh', value: 'bai2' },
              { text: 'Bài 3 – Sắp xếp nổi bọt',   value: 'bai3' },
              { text: 'Bài 4 – Robot mê cung',       value: 'bai4' },
              { text: 'Bài 5 – Đếm tần suất',       value: 'bai5' },
            ],
          },
        },
      };
    }

    // Block implementations (giữ lại cho thí sinh dùng trong code Scratch)
    async startContest({ PROBLEM_ID }) {
      await window.CONTEST_BRIDGE.runTests(PROBLEM_ID, (r) => {
        if (r.status === 'pass') console.log(`TC${r.index}: ✅`);
        else if (r.status !== 'running') console.log(`TC${r.index}: ❌ (${r.status})`);
      });
    }
    getTimeLeft() {
      if (!this._startMs) return this._limitMs / 1000;
      return Math.max(0, ((this._limitMs - (Date.now() - this._startMs)) / 1000).toFixed(1));
    }
    getScore()    { return 0; }
    checkResult() { return this._compare(this._getList('output'), this._getList('expected')); }
    isTimeUp()    { return this._startMs > 0 && (Date.now() - this._startMs) >= this._limitMs; }
  }

  Scratch.extensions.register(new TinHocTreContest());
})();
