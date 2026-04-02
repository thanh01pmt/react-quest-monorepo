/**
 * extension/contest.js
 * ═══════════════════════════════════════════════════════════════
 * TurboWarp Unsandboxed Extension — Tin học trẻ Contest System
 * Phiên bản sản xuất: tích hợp đầy đủ timer, I/O, checker,
 * anti-cheat hook và phản hồi trực quan cho thí sinh.
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('[TinHocTre] Extension phải chạy ở chế độ Unsandboxed!');
  }

  // ── Hằng số ─────────────────────────────────────────────────────────────
  const API_BASE       = window.CONTEST_API || '/api';
  const DEFAULT_LIMIT  = 60_000; // 60 giây
  const TICK_MS        = 50;     // Độ phân giải đồng hồ

  const vm      = Scratch.vm;
  const runtime = vm.runtime;

  // ─────────────────────────────────────────────────────────────────────────
  class TinHocTreContest {

    constructor() {
      this.startTime     = 0;
      this.duration      = DEFAULT_LIMIT;
      this.cache         = {};       // Cache JSON đề đã fetch
      this.currentProblem = null;
      this.score         = 0;
      this.totalScore    = 0;
      this.tickerId      = null;
      this.judgeLog      = [];

      this._hookGreenFlag();
      this._startTickWatcher();
    }

    // ── Metadata ────────────────────────────────────────────────────────────
    getInfo() {
      return {
        id:     'tinhocTreContest',
        name:   '🏆 Tin học trẻ',
        color1: '#7C3AED',
        color2: '#5B21B6',
        color3: '#4C1D95',
        blocks: [
          // ── Nhóm 1: Điều khiển đề thi ─────────────────────────────────
          {
            opcode:    'startContest',
            blockType: Scratch.BlockType.COMMAND,
            text:      'Bắt đầu đề [PROBLEM_ID]',
            arguments: {
              PROBLEM_ID: {
                type:         Scratch.ArgumentType.STRING,
                menu:         'problemMenu',
                defaultValue: 'bai1',
              },
            },
          },
          {
            opcode:    'runTestcase',
            blockType: Scratch.BlockType.COMMAND,
            text:      'Chạy testcase số [INDEX] của đề [PROBLEM_ID]',
            arguments: {
              INDEX: {
                type:         Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              PROBLEM_ID: {
                type:         Scratch.ArgumentType.STRING,
                defaultValue: 'bai1',
              },
            },
          },
          { blockType: Scratch.BlockType.SEPARATOR },

          // ── Nhóm 2: Reporter ──────────────────────────────────────────
          {
            opcode:    'getTimeLeft',
            blockType: Scratch.BlockType.REPORTER,
            text:      'Thời gian còn lại (giây)',
          },
          {
            opcode:    'getScore',
            blockType: Scratch.BlockType.REPORTER,
            text:      'Điểm tích lũy',
          },
          {
            opcode:    'getTotalScore',
            blockType: Scratch.BlockType.REPORTER,
            text:      'Tổng điểm tối đa',
          },
          {
            opcode:    'getTestcaseCount',
            blockType: Scratch.BlockType.REPORTER,
            text:      'Số testcase của đề [PROBLEM_ID]',
            arguments: {
              PROBLEM_ID: {
                type:         Scratch.ArgumentType.STRING,
                defaultValue: 'bai1',
              },
            },
          },
          { blockType: Scratch.BlockType.SEPARATOR },

          // ── Nhóm 3: Kiểm tra ──────────────────────────────────────────
          {
            opcode:    'checkResult',
            blockType: Scratch.BlockType.BOOLEAN,
            text:      'output khớp expected?',
          },
          {
            opcode:    'isTimeUp',
            blockType: Scratch.BlockType.BOOLEAN,
            text:      'Đã hết giờ?',
          },
          { blockType: Scratch.BlockType.SEPARATOR },

          // ── Nhóm 4: Phản hồi ──────────────────────────────────────────
          {
            opcode:    'sayResult',
            blockType: Scratch.BlockType.COMMAND,
            text:      'Hiển thị kết quả lên nhân vật trong [SECS] giây',
            arguments: {
              SECS: {
                type:         Scratch.ArgumentType.NUMBER,
                defaultValue: 3,
              },
            },
          },
          {
            opcode:    'resetAll',
            blockType: Scratch.BlockType.COMMAND,
            text:      'Đặt lại toàn bộ (reset)',
          },
        ],
        menus: {
          problemMenu: {
            acceptReporters: false,
            items: [
              { text: 'Bài 1 – Tìm lớn nhất', value: 'bai1' },
              { text: 'Bài 2 – Robot đi theo lệnh', value: 'bai2' },
              { text: 'Bài 3 – Sắp xếp nổi bọt', value: 'bai3' },
              { text: 'Bài 4 – Robot trong mê cung', value: 'bai4' },
              { text: 'Bài 5 – Đếm tần suất', value: 'bai5' },
            ],
          },
        },
      };
    }

    // ── Block: startContest ─────────────────────────────────────────────────
    async startContest({ PROBLEM_ID }) {
      const problem = await this._fetchProblem(PROBLEM_ID);
      if (!problem) return;

      this.currentProblem = problem;
      this.score          = 0;
      this.totalScore     = problem.test_cases.reduce((s, t) => s + (t.weight || 10), 0);
      this.duration       = (problem.time_limit || 60) * 1000;
      this.judgeLog       = [];

      this._updateVar('score',      this.score);
      this._updateVar('totalScore', this.totalScore);

      for (let i = 0; i < problem.test_cases.length; i++) {
        await this._executeTestcase(problem.test_cases[i], i + 1);
      }

      // Hiển thị tóm tắt cuối
      const pct = Math.round((this.score / this.totalScore) * 100);
      console.info(
        `%c[TinHocTre] Hoàn thành: ${this.score}/${this.totalScore} (${pct}%)`,
        'color:#7C3AED;font-weight:bold'
      );
    }

    // ── Block: runTestcase (chạy 1 testcase lẻ để debug) ────────────────────
    async runTestcase({ INDEX, PROBLEM_ID }) {
      const problem = await this._fetchProblem(PROBLEM_ID);
      if (!problem) return;

      const idx = Math.max(1, Math.min(parseInt(INDEX), problem.test_cases.length));
      const tc  = problem.test_cases[idx - 1];
      if (!tc) return;

      this.duration = (problem.time_limit || 60) * 1000;
      await this._executeTestcase(tc, idx);
    }

    // ── Chạy 1 testcase ─────────────────────────────────────────────────────
    async _executeTestcase(tc, index) {
      // 1. Đặt lại state
      this._setList('output',    []);
      this._setList('inputData', tc.input.map(String));
      this._setList('expected',  tc.expected.map(String));

      // 2. Bắt đầu đồng hồ và cờ xanh
      this.startTime = Date.now();
      vm.greenFlag();

      // 3. Đợi kết quả
      await this._waitForOutput(tc.expected.length);
      vm.stopAll();
      await this._sleep(80); // Chờ VM dừng hẳn

      // 4. Chấm điểm
      const passed = this.checkResult();
      if (passed) {
        this.score += (tc.weight || 10);
        this._updateVar('score', this.score);
      }

      this.judgeLog.push({ index, passed, weight: tc.weight || 10 });

      console.log(
        `%c[TinHocTre] TC${index}: ${passed ? '✅ Đúng' : '❌ Sai'} (+${passed ? tc.weight : 0}đ)`,
        `color:${passed ? '#16a34a' : '#dc2626'}`
      );
    }

    // ── Đợi output đủ phần tử hoặc hết giờ ─────────────────────────────────
    _waitForOutput(expectedLen) {
      return new Promise(resolve => {
        const interval = setInterval(() => {
          const out     = this._getList('output');
          const elapsed = Date.now() - this.startTime;

          if (out.length >= expectedLen || elapsed >= this.duration) {
            clearInterval(interval);
            resolve();
          }
        }, TICK_MS);
      });
    }

    // ── Block: getTimeLeft ──────────────────────────────────────────────────
    getTimeLeft() {
      if (!this.startTime) return this.duration / 1000;
      const elapsed = Date.now() - this.startTime;
      return Math.max(0, ((this.duration - elapsed) / 1000).toFixed(1));
    }

    // ── Block: getScore / getTotalScore ─────────────────────────────────────
    getScore()      { return this.score; }
    getTotalScore() { return this.totalScore; }

    // ── Block: getTestcaseCount ─────────────────────────────────────────────
    async getTestcaseCount({ PROBLEM_ID }) {
      const p = await this._fetchProblem(PROBLEM_ID);
      return p ? p.test_cases.length : 0;
    }

    // ── Block: checkResult (Boolean) ────────────────────────────────────────
    checkResult() {
      const out = this._getList('output');
      const exp = this._getList('expected');
      if (out.length !== exp.length) return false;
      return out.map(String).join('|') === exp.map(String).join('|');
    }

    // ── Block: isTimeUp ─────────────────────────────────────────────────────
    isTimeUp() {
      if (!this.startTime) return false;
      return (Date.now() - this.startTime) >= this.duration;
    }

    // ── Block: sayResult ────────────────────────────────────────────────────
    sayResult({ SECS }) {
      const pct     = this.totalScore > 0
        ? Math.round((this.score / this.totalScore) * 100)
        : 0;
      const passed  = this.judgeLog.filter(l => l.passed).length;
      const total   = this.judgeLog.length;
      const msg     = `${this.score}/${this.totalScore}đ (${pct}%) | ${passed}/${total} TC`;

      const sprite = this._getMainSprite();
      if (sprite) {
        sprite.setSay(msg);
        setTimeout(() => sprite.setSay(''), parseInt(SECS) * 1000);
      }
    }

    // ── Block: resetAll ─────────────────────────────────────────────────────
    resetAll() {
      this.startTime      = 0;
      this.score          = 0;
      this.totalScore     = 0;
      this.judgeLog       = [];
      this.currentProblem = null;
      this._setList('inputData', []);
      this._setList('output',    []);
      this._setList('expected',  []);
      this._updateVar('score',      0);
      this._updateVar('totalScore', 0);
      vm.stopAll();
    }

    // ══════════════════ PRIVATE HELPERS ══════════════════════════════════════

    // ── Fetch đề thi (có cache) ──────────────────────────────────────────────
    async _fetchProblem(id) {
      if (this.cache[id]) return this.cache[id];
      try {
        const res = await fetch(`${API_BASE}/problems/${id}`, {
          headers: { Authorization: `Bearer ${this._getToken()}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.cache[id] = await res.json();
        return this.cache[id];
      } catch (err) {
        console.error(`[TinHocTre] Không tải được đề "${id}":`, err.message);
        return null;
      }
    }

    // ── Ghi đè Green Flag để đồng hồ luôn đồng bộ ──────────────────────────
    _hookGreenFlag() {
      const orig = runtime.requestGreenFlag.bind(runtime);
      runtime.requestGreenFlag = () => {
        if (!this.startTime) this.startTime = Date.now();
        orig();
      };
    }

    // ── Tick watcher: auto-stop khi TLE ─────────────────────────────────────
    _startTickWatcher() {
      runtime.on('BEFORE_EXECUTE', () => {
        if (!this.startTime) return;
        if ((Date.now() - this.startTime) > this.duration + 300) {
          console.warn('[TinHocTre] ⏰ TLE! Dừng VM.');
          this.startTime = 0;
          vm.stopAll();
        }
      });
    }

    // ── Lấy/Ghi danh sách Scratch ────────────────────────────────────────────
    _getStage() { return runtime.getTargetForStage(); }

    _getList(name) {
      const list = this._getStage()?.lookupVariableByNameAndType(name, 'list');
      return list ? list.value : [];
    }

    _setList(name, arr) {
      const list = this._getStage()?.lookupVariableByNameAndType(name, 'list');
      if (list) {
        list.value = arr;
        list._monitorUpToDate = false;
      }
    }

    // ── Cập nhật biến Scratch ────────────────────────────────────────────────
    _updateVar(name, val) {
      const v = this._getStage()?.lookupVariableByNameAndType(name, '');
      if (v) v.value = val;
    }

    // ── Lấy sprite chính (không phải Stage) ─────────────────────────────────
    _getMainSprite() {
      return runtime.targets.find(t => !t.isStage && t.isOriginal) || null;
    }

    // ── Lấy JWT token từ localStorage ────────────────────────────────────────
    _getToken() {
      try { return localStorage.getItem('contest_token') || ''; } catch { return ''; }
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  }

  Scratch.extensions.register(new TinHocTreContest());
})();
