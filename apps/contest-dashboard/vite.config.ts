import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5174,
		fs: {
			allow: ["../../", "../../packages/quest-player"],
		},
	},
	resolve: {
		dedupe: ["blockly"],
		alias: {
			"@repo/quest-player": path.resolve(
				__dirname,
				"../../packages/quest-player/src",
			),
		},
	},
});
