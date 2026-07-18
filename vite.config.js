import { defineConfig } from 'vite';

// Многостраничный сайт (лендинг + страница «дякуємо»).
// Изображения лежат в public/assets и отдаются «как есть» по путям assets/... —
// часть ссылок формируется в JS (data.js) и не видна статическому анализу Vite,
// поэтому им нужен public/, а не обработка бандлером.
export default defineConfig({
  appType: 'mpa',
  publicDir: 'public',
  // В dev проксируем /api на локальный Express (npm run server).
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Не копируем public/ в dist: изображения отдаём из public/ напрямую (Express),
    // чтобы не дублировать ~8 МБ картинок в собранной папке и в git.
    copyPublicDir: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        thanks: 'thanks/index.html',
      },
    },
  },
});
