import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

export default defineConfig({
  plugins: [uni()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },

  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  build: {
    // 小程序包大小优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
      },
    },
  },
});
