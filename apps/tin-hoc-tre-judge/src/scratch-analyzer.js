const analysis = require('scratch-analysis');
const { loadSb3 } = require('sb-util');
const { promisify } = require('util');

const analysisAsync = promisify(analysis);

/**
 * ScratchAnalyzer
 * Phân tích cấu trúc file .sb3 (tĩnh) để chấm điểm theo barem Tin học trẻ.
 */
class ScratchAnalyzer {
  /**
   * Phân tích một buffer file .sb3
   * @param {Buffer} buffer 
   * @param {Array} rules Danh sách structural_checks từ quest data
   */
  static async analyze(buffer, rules = []) {
    if (!rules || rules.length === 0) return { score: 0, results: [] };

    const results = [];
    let totalScore = 0;

    try {
      // 1. Lấy thông tin tổng quan từ scratch-analysis
      const summary = await analysisAsync(buffer);
      
      // 2. Load sb-util để truy vấn sâu hơn nếu cần
      const project = await loadSb3(buffer);

      for (const rule of rules) {
        let passed = false;
        const { check, description, weight = 10 } = rule;

        try {
          // Eval đơn giản cho các quy tắc cơ bản
          // Quy tắc dạng: "sprites.count >= 2"
          if (check.includes('sprites.count')) {
            const count = summary.sprites.count;
            passed = eval(check.replace('sprites.count', count));
          } 
          // Quy tắc dạng: "blocks.contains('motion_gotoxy')"
          else if (check.includes('blocks.contains')) {
            const opcode = check.match(/'([^']+)'/)[1];
            const blocks = project.blocks().query({ opcode });
            passed = blocks.length > 0;
          }
          // Quy tắc dạng: "variables.exists('Score')"
          else if (check.includes('variables.exists')) {
            const varName = check.match(/'([^']+)'/)[1];
            passed = summary.variables.some(v => v.name === varName);
          }
          // Fallback hoặc thêm logic khác ở đây
        } catch (evalErr) {
          console.error(`[Analyzer] Lỗi khi kiểm tra quy tắc "${check}":`, evalErr.message);
        }

        if (passed) totalScore += weight;
        
        results.push({
          id: rule.id,
          description,
          passed,
          weight,
          score: passed ? weight : 0
        });
      }

      return { score: totalScore, results };
    } catch (err) {
      console.error('[Analyzer] Lỗi phân tích:', err);
      return { score: 0, results: [], error: err.message };
    }
  }
}

module.exports = { ScratchAnalyzer };
