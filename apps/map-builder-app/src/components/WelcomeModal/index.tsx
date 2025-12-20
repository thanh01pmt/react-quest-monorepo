import React, { useState } from 'react';
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
          <h2>🎮 Chào mừng đến với Map Builder!</h2>
          <button onClick={handleClose} className="welcome-modal-close-btn">&times;</button>
        </div>
        <div className="welcome-modal-body">
          <p>Đây là công cụ giúp bạn tạo và chỉnh sửa các màn chơi (map) cho game một cách trực quan.</p>

          <div className="wm-highlight-box">
            <h3>✨ Tính năng mới</h3>
            <ul>
              <li><strong>30+ Topologies:</strong> Tự động tạo map với 30 kiểu hình dạng khác nhau (L, T, U, Spiral, Maze, Islands...)</li>
              <li><strong>Validation Badge:</strong> Kiểm tra tính hợp lệ của map theo thời gian thực</li>
              <li><strong>Keyboard Shortcuts:</strong> Nhấn <kbd>?</kbd> để xem danh sách phím tắt</li>
              <li><strong>30 Pedagogy Strategies:</strong> Chiến lược đặt item theo mức độ học thuật</li>
            </ul>
          </div>

          <h3>🛠️ Hai Chế Độ Làm Việc</h3>

          <div className="wm-mode-cards">
            <div className="wm-mode-card">
              <h4>📦 Chế độ Manual</h4>
              <p><em>Tab "Assets" - Xây dựng thủ công</em></p>
              <ol>
                <li>Chọn asset từ palette bên trái</li>
                <li>Click vào grid 3D để đặt đối tượng</li>
                <li>Đặt <code>Player Start</code> và <code>Finish</code></li>
                <li>Nhấn "Tự động giải" để tạo lời giải</li>
              </ol>
            </div>
            <div className="wm-mode-card">
              <h4>🤖 Chế độ Auto</h4>
              <p><em>Tab "Topology" - Tự động tạo map</em></p>
              <ol>
                <li>Chọn topology (hình dạng map)</li>
                <li>Điều chỉnh tham số</li>
                <li>Chọn Pedagogy Strategy</li>
                <li>Nhấn "Generate Map"</li>
              </ol>
            </div>
          </div>

          <h3>⌨️ Phím tắt quan trọng</h3>
          <div className="wm-shortcuts-grid">
            <div className="wm-shortcut"><kbd>?</kbd> <span>Xem phím tắt</span></div>
            <div className="wm-shortcut"><kbd>⌘Z</kbd> <span>Undo</span></div>
            <div className="wm-shortcut"><kbd>⌘⇧Z</kbd> <span>Redo</span></div>
            <div className="wm-shortcut"><kbd>Delete</kbd> <span>Xóa</span></div>
            <div className="wm-shortcut"><kbd>⌘A</kbd> <span>Chọn tất cả</span></div>
            <div className="wm-shortcut"><kbd>R</kbd> <span>Xoay</span></div>
            <div className="wm-shortcut"><kbd>C</kbd> <span>Copy</span></div>
            <div className="wm-shortcut"><kbd>Space+Drag</kbd> <span>Pan camera</span></div>
          </div>

          <h3>📋 Lưu ý quan trọng</h3>
          <ul>
            <li><strong>Đối tượng bắt buộc:</strong> Mỗi map cần có <code>Player Start</code> và <code>Finish Point</code></li>
            <li><strong>Validation Badge:</strong> Xem góc trên bên phải để kiểm tra tính hợp lệ</li>
            <li><strong>Smart Snap:</strong> Bật để item chỉ đặt được trên đường đi hợp lệ</li>
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