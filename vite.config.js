import { defineConfig } from 'vite';

// Многостраничный сайт (лендинг + страница «дякуємо»).
// Изображения лежат в public/assets и отдаются «как есть» по путям assets/... —
// часть ссылок формируется в JS (data.js) и не видна статическому анализу Vite,
// поэтому им нужен public/, а не обработка бандлером.
export default defineConfig({
  appType: 'mpa',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        thanks: 'thanks.html',
      },
    },
  },
});
