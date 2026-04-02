/**
 * PATCH: src/lib/libraries/extensions/index.jsx
 * 
 * Thêm block này vào CUỐI mảng export default [...] trong file trên.
 * Đây là khai báo metadata để extension xuất hiện trong library của TurboWarp.
 */

// Thêm import ở đầu file (sau các import khác):
// import tinhocTreIconURL from './tinhoctre/icon.svg';

const TINHOCTRE_ENTRY = {
  name: 'Tin học trẻ Contest',
  extensionId: 'tinhocTreContest',
  // iconURL: tinhocTreIconURL,   // Uncomment khi có icon
  description: 'Hệ thống thi lập trình Scratch nội bộ đồng dạng Tin học trẻ.',
  featured: true,
  disabled: false,
  // Đây là điểm mấu chốt: khai báo unsandboxed = true
  // để extension chạy cùng context với VM
  unsandboxed: true,
};

// ════════════════════════════════════════════════════════════════
// PATCH: src/extension-support/extension-manager.js
//
// Tìm hàm _loadExtensionURL hoặc _registerInternalExtension
// Thêm đoạn code dưới đây để đăng ký extension tĩnh:
// ════════════════════════════════════════════════════════════════

const EXTENSION_MANAGER_PATCH = `
// Thêm vào đầu file extension-manager.js (sau phần require):
const TinHocTreContest = require('./extensions/tinhoctre');

// Thêm vào constructor của ExtensionManager:
// this._registerInternalExtension(TinHocTreContest);

// Hoặc thêm vào phần CORE_EXTENSIONS:
const CORE_EXTENSIONS = [
  // ... các extension mặc định khác ...
  'tinhocTreContest'
];
`;

/**
 * PATCH: src/lib/libraries/extensions/tinhoctre/index.js
 * 
 * File này chứa toàn bộ logic extension (contest.js đã viết ở Bước 2).
 * Chỉ cần wrap thêm module.exports cho môi trường Node/Webpack:
 */
const EXTENSION_WRAPPER = `
// Đầu file: xóa IIFE wrapper, export class trực tiếp
class TinHocTreContest {
  // ... toàn bộ code từ contest.js ...
}

// Cuối file: thay Scratch.extensions.register(...) bằng:
if (typeof module !== 'undefined') {
  module.exports = TinHocTreContest;  // Cho Node.js / Webpack
} else {
  Scratch.extensions.register(new TinHocTreContest()); // Cho browser trực tiếp
}
`;

module.exports = { TINHOCTRE_ENTRY, EXTENSION_MANAGER_PATCH, EXTENSION_WRAPPER };
