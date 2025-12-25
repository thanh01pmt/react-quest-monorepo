import React, { useState } from 'react';
import { Gamepad2, Sparkles, Box, Bot, Keyboard, HelpCircle, ClipboardList, PenTool, Eye, FolderOpen, Save, Upload, RotateCw, Play, Info, AlertTriangle } from 'lucide-react';
import './WelcomeModal.css';

interface WelcomeModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  return (
    <div className="welcome-modal-overlay" onClick={handleClose}>
      <div className="welcome-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-modal-header">
          <h2><Gamepad2 size={24} /> Chào mừng đến với Map Builder!</h2>
          <button onClick={handleClose} className="welcome-modal-close-btn">&times;</button>
        </div>
        <div className="welcome-modal-body">
          <p>Đây là công cụ giúp bạn tạo và chỉnh sửa các màn chơi (map) học thuật cho game một cách trực quan.</p>

          <div className="wm-highlight-box">
            <h3><Sparkles size={18} /> Tính năng chính</h3>
            <ul>
              <li><strong>34+ Topologies:</strong> Tự động tạo map với 34 kiểu hình dạng khác nhau (L, T, U, V, H, S, Z, Spiral, Maze, Islands, 3D Staircase...)</li>
              <li><strong>9 Pedagogy Strategies:</strong> Chiến lược đặt item theo mức độ học thuật (Loop Logic, Function Logic, Conditional, While Loop, Nested Loops...)</li>
              <li><strong>Validation Badge:</strong> Kiểm tra tính hợp lệ của map theo thời gian thực</li>
              <li><strong>Auto Solver:</strong> Tự động tạo lời giải với Raw Action, Basic và Optimal solutions</li>
              <li><strong>Area Clone:</strong> Copy/Paste và nhân bản các vùng chọn</li>
              <li><strong>Keyboard Shortcuts:</strong> Nhấn <kbd>?</kbd> để xem danh sách đầy đủ phím tắt</li>
            </ul>
          </div>

          <h3><PenTool size={20} /> Hai Chế Độ Làm Việc</h3>

          <div className="wm-mode-cards">
            <div className="wm-mode-card">
              <h4><Box size={18} /> Chế độ Manual</h4>
              <p><em>Tab "Assets" - Xây dựng thủ công</em></p>
              <ol>
                <li>Chọn asset từ palette bên trái</li>
                <li>Click vào grid 3D để đặt đối tượng</li>
                <li>Đặt <code>Player Start</code> và <code>Finish</code></li>
                <li>Nhấn "Gen Raw Action" để tạo lời giải</li>
              </ol>
            </div>
            <div className="wm-mode-card">
              <h4><Bot size={18} /> Chế độ Auto</h4>
              <p><em>Tab "Topology" - Tự động tạo map</em></p>
              <ol>
                <li>Chọn topology (hình dạng map)</li>
                <li>Điều chỉnh tham số (size, complexity...)</li>
                <li>Chọn Pedagogy Strategy</li>
                <li>Nhấn "Generate Map"</li>
              </ol>
            </div>
          </div>

          <h3><Keyboard size={20} /> Phím tắt quan trọng</h3>
          <div className="wm-shortcuts-grid">
            {/* Editing */}
            <div className="wm-shortcut"><kbd>?</kbd> <span>Xem phím tắt</span></div>
            <div className="wm-shortcut"><kbd>⌘Z</kbd> <span>Undo</span></div>
            <div className="wm-shortcut"><kbd>⌘⇧Z</kbd> <span>Redo</span></div>
            <div className="wm-shortcut"><kbd>⌘C</kbd> <span>Copy</span></div>
            <div className="wm-shortcut"><kbd>⌘V</kbd> <span>Paste</span></div>
            <div className="wm-shortcut"><kbd>⌘D</kbd> <span>Duplicate</span></div>
            <div className="wm-shortcut"><kbd>⌘A</kbd> <span>Chọn tất cả</span></div>
            <div className="wm-shortcut"><kbd>Esc</kbd> <span>Bỏ chọn/Hủy</span></div>
            {/* Tools/Modes */}
            <div className="wm-shortcut"><kbd>S</kbd> <span>Smart Select</span></div>
            <div className="wm-shortcut"><kbd>G</kbd> <span>Grab/Move</span></div>
            <div className="wm-shortcut"><kbd>R</kbd> <span>Rotate</span></div>
            <div className="wm-shortcut"><kbd>F</kbd> <span>Fill mode</span></div>
            {/* Assets */}
            <div className="wm-shortcut"><kbd>1-6</kbd> <span>Đặt items nhanh</span></div>
            {/* File */}
            <div className="wm-shortcut"><kbd>⌘S</kbd> <span>Export JSON</span></div>
            <div className="wm-shortcut"><kbd>⌘O</kbd> <span>Import JSON</span></div>
          </div>

          <h3><ClipboardList size={20} /> Lưu ý quan trọng</h3>
          <ul>
            <li><strong>Đối tượng bắt buộc:</strong> Mỗi map cần có <code>Player Start</code> (có thể xoay để chọn hướng) và <code>Finish Point</code></li>
            <li><strong>Validation Badge:</strong> Xem góc trên bên phải để kiểm tra tính hợp lệ (✓ Valid / <AlertTriangle size={12} /> Invalid)</li>
            <li><strong>Smart Snap:</strong> Bật để item chỉ đặt được trên đường đi hợp lệ</li>
            <li><strong>Topology Inspector:</strong> Phân tích cấu trúc map để debug và tối ưu</li>
          </ul>
        </div>
        <div className="welcome-modal-footer">
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Không hiển thị lại
          </label>
          <button onClick={handleClose} className="welcome-modal-ok-btn">Đã hiểu</button>
        </div>
      </div>
    </div>
  );
};