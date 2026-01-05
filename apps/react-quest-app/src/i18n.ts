// apps/react-quest-app/src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import tài nguyên dịch đã được export từ package quest-player
import { questPlayerResources } from '@repo/quest-player/i18n';

// --- START: PATCH for react-quest-app ---
// Thêm các bản dịch cho category với key viết hoa để khớp với yêu cầu của Blockly
const appResources = {
  en: {
    translation: {
      "Games.catActions": "Actions",
      "Games.catEvents": "Events",
      "Games.catMovement": "Movement",
      "Games.catLoops": "Loops",
      "Games.catLogic": "Logic",
      "Games.catMath": "Math",
      "Games.catVariables": "Variables",
      "Games.catProcedures": "Functions",
      // Practice Mode translations
      "Practice.title": "Practice Mode",
      "Practice.subtitle": "Select topics and difficulty to start practicing",
      "Practice.select_topics": "Practice Topics",
      "Practice.category_sequential": "Sequential",
      "Practice.category_loop": "Loop",
      "Practice.category_conditional": "Conditional",
      "Practice.category_function": "Function",
      "Practice.category_variable": "Variable",
      "Practice.category_advanced": "Advanced",
      "Practice.question_count": "Questions",
      "Practice.difficulty": "Difficulty",
      "Practice.difficulty_very_easy": "Very Easy",
      "Practice.difficulty_easy": "Easy",
      "Practice.difficulty_medium": "Medium",
      "Practice.difficulty_hard": "Hard",
      "Practice.difficulty_very_hard": "Very Hard",
      "Practice.topics_selected": "topics",
      "Practice.questions": "questions",
      "Practice.challenge_me": "Challenge Me!",
      "Practice.challenge_desc": "Start now with random topics",
      "Practice.or_custom": "or customize",
      "Practice.start": "Start Practice",
      "Practice.start_custom": "Start Custom Practice",
      "Practice.starting": "Creating...",
      "Practice.back_to_quests": "Back to Quests",
      // Session translations
      "Practice.loading": "Loading...",
      "Practice.error": "Error",
      "Practice.back": "Go Back",
      "Practice.complete": "Complete!",
      "Practice.correct": "Correct",
      "Practice.level": "Level",
      "Practice.practice_again": "Practice Again",
      "Practice.back_home": "Back to Home",
      "Practice.game_placeholder": "Game will be integrated here",
      "Practice.mark_correct": "Mark Correct",
      "Practice.skip": "Skip",
    },
  },
  vi: {
    translation: {
      "Games.catActions": "Hành động",
      "Games.catEvents": "Sự kiện",
      "Games.catMovement": "Di chuyển",
      "Games.catLoops": "Vòng lặp",
      "Games.catLogic": "Logic",
      "Games.catMath": "Công thức toán",
      "Games.catVariables": "Biến",
      "Games.catProcedures": "Hàm",
      // Practice Mode translations
      "Practice.title": "Chế độ Luyện tập",
      "Practice.subtitle": "Chọn chủ đề và độ khó để bắt đầu luyện tập",
      "Practice.select_topics": "Chủ đề luyện tập",
      "Practice.category_sequential": "Tuần tự",
      "Practice.category_loop": "Vòng lặp",
      "Practice.category_conditional": "Điều kiện",
      "Practice.category_function": "Hàm",
      "Practice.category_variable": "Biến",
      "Practice.category_advanced": "Nâng cao",
      "Practice.question_count": "Số câu",
      "Practice.difficulty": "Độ khó",
      "Practice.difficulty_very_easy": "Rất dễ",
      "Practice.difficulty_easy": "Dễ",
      "Practice.difficulty_medium": "Trung bình",
      "Practice.difficulty_hard": "Khó",
      "Practice.difficulty_very_hard": "Rất khó",
      "Practice.topics_selected": "chủ đề",
      "Practice.questions": "câu hỏi",
      "Practice.challenge_me": "Thách thức tôi!",
      "Practice.challenge_desc": "Bắt đầu ngay với chủ đề ngẫu nhiên",
      "Practice.or_custom": "hoặc tùy chỉnh",
      "Practice.start": "Bắt đầu luyện tập",
      "Practice.start_custom": "Bắt đầu luyện tập",
      "Practice.starting": "Đang tạo...",
      "Practice.back_to_quests": "Quay lại danh sách thử thách",
      // Session translations
      "Practice.loading": "Đang tải...",
      "Practice.error": "Lỗi",
      "Practice.back": "Quay lại",
      "Practice.complete": "Hoàn thành!",
      "Practice.correct": "Đúng",
      "Practice.level": "Cấp độ",
      "Practice.practice_again": "Luyện tập tiếp",
      "Practice.back_home": "Về trang chủ",
      "Practice.game_placeholder": "Phần game sẽ được tích hợp ở đây",
      "Practice.mark_correct": "Đánh dấu đúng",
      "Practice.skip": "Bỏ qua",
    },
  },
};
// --- END: PATCH ---

const resources = {
  en: {
    translation: { ...questPlayerResources.en.translation, ...appResources.en.translation },
  },
  vi: {
    translation: { ...questPlayerResources.vi.translation, ...appResources.vi.translation },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
    },
  });

export default i18n;