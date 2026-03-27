// apps/contest-dashboard/src/i18n.ts

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import tài nguyên dịch đã được export từ package quest-player
import { questPlayerResources } from "@repo/quest-player/i18n";

const resources = {
	en: {
		translation: { ...questPlayerResources.en.translation },
	},
	vi: {
		translation: { ...questPlayerResources.vi.translation },
	},
};

i18n.use(initReactI18next).init({
	resources,
	fallbackLng: "vi", // Default to Vietnamese for the dashboard
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
