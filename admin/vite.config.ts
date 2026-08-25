import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Админ-кабинет. Отдельное приложение со своим доменом и своим деплоем —
// на витрину не ссылается и её кода не использует.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
  build: { target: 'es2022' },
});
