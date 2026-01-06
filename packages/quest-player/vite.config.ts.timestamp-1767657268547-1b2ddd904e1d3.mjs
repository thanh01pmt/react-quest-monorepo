// vite.config.ts
import { defineConfig } from "file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/node_modules/.pnpm/vite@5.4.20_@types+node@24.7.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.20_@types+node@24.7.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import dts from "file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/node_modules/.pnpm/vite-plugin-dts@3.9.1_@types+node@24.7.1_rollup@4.52.4_typescript@5.9.3_vite@5.4.20_@types+node@24.7.1_/node_modules/vite-plugin-dts/dist/index.mjs";
import path from "path";
import { viteStaticCopy } from "file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/node_modules/.pnpm/vite-plugin-static-copy@3.1.3_vite@5.4.20_@types+node@24.7.1_/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "/Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/packages/quest-player";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true
    }),
    // Thêm plugin vào đây
    viteStaticCopy({
      targets: [
        {
          // Copy tất cả mọi thứ từ thư mục public của package
          src: path.resolve(__vite_injected_original_dirname, "public/*"),
          // Đến thư mục gốc của output (dist)
          dest: "./"
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__vite_injected_original_dirname, "src/index.ts"),
        i18n: path.resolve(__vite_injected_original_dirname, "src/i18n.ts")
      },
      name: "QuestPlayer",
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "three": "THREE",
          "@react-three/fiber": "ReactThreeFiber",
          "@react-three/drei": "ReactThreeDrei"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG9ueXBoYW0vTUVHQS9XZWJBcHAvYmxvY2tseS1yZWFjdC9yZWFjdC1xdWVzdC1tb25vcmVwby9wYWNrYWdlcy9xdWVzdC1wbGF5ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90b255cGhhbS9NRUdBL1dlYkFwcC9ibG9ja2x5LXJlYWN0L3JlYWN0LXF1ZXN0LW1vbm9yZXBvL3BhY2thZ2VzL3F1ZXN0LXBsYXllci92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG9ueXBoYW0vTUVHQS9XZWJBcHAvYmxvY2tseS1yZWFjdC9yZWFjdC1xdWVzdC1tb25vcmVwby9wYWNrYWdlcy9xdWVzdC1wbGF5ZXIvdml0ZS5jb25maWcudHNcIjsvLyBwYWNrYWdlcy9xdWVzdC1wbGF5ZXIvdml0ZS5jb25maWcudHNcbiAgICBcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tICd2aXRlLXBsdWdpbi1zdGF0aWMtY29weSc7IC8vIEltcG9ydCBwbHVnaW5cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgZHRzKHtcbiAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsXG4gICAgfSksXG4gICAgLy8gVGhcdTAwRUFtIHBsdWdpbiB2XHUwMEUwbyBcdTAxMTFcdTAwRTJ5XG4gICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgdGFyZ2V0czogW1xuICAgICAgICB7XG4gICAgICAgICAgLy8gQ29weSB0XHUxRUE1dCBjXHUxRUEzIG1cdTFFQ0RpIHRoXHUxRUU5IHRcdTFFRUIgdGhcdTAxQjAgbVx1MUVFNWMgcHVibGljIGNcdTFFRTdhIHBhY2thZ2VcbiAgICAgICAgICBzcmM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdwdWJsaWMvKicpLCBcbiAgICAgICAgICAvLyBcdTAxMTBcdTFFQkZuIHRoXHUwMUIwIG1cdTFFRTVjIGdcdTFFRDFjIGNcdTFFRTdhIG91dHB1dCAoZGlzdClcbiAgICAgICAgICBkZXN0OiAnLi8nIFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSlcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXG4gICAgICAgIGkxOG46IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaTE4bi50cycpXG4gICAgICB9LFxuICAgICAgbmFtZTogJ1F1ZXN0UGxheWVyJyxcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAnY2pzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWydyZWFjdCcsICdyZWFjdC1kb20nLCAndGhyZWUnLCAnQHJlYWN0LXRocmVlL2ZpYmVyJywgJ0ByZWFjdC10aHJlZS9kcmVpJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxuICAgICAgICAgICd0aHJlZSc6ICdUSFJFRScsXG4gICAgICAgICAgJ0ByZWFjdC10aHJlZS9maWJlcic6ICdSZWFjdFRocmVlRmliZXInLFxuICAgICAgICAgICdAcmVhY3QtdGhyZWUvZHJlaSc6ICdSZWFjdFRocmVlRHJlaScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsU0FBUyxzQkFBc0I7QUFOL0IsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0Ysa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBO0FBQUEsSUFFRCxlQUFlO0FBQUEsTUFDYixTQUFTO0FBQUEsUUFDUDtBQUFBO0FBQUEsVUFFRSxLQUFLLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUE7QUFBQSxVQUV2QyxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLEtBQUssUUFBUSxrQ0FBVyxjQUFjO0FBQUEsUUFDN0MsTUFBTSxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQzdDO0FBQUEsTUFDQSxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsSUFDdkI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxTQUFTLGFBQWEsU0FBUyxzQkFBc0IsbUJBQW1CO0FBQUEsTUFDbkYsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1AsYUFBYTtBQUFBLFVBQ2IsU0FBUztBQUFBLFVBQ1Qsc0JBQXNCO0FBQUEsVUFDdEIscUJBQXFCO0FBQUEsUUFDdkI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
