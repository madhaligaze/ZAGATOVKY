import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Витрина. Админка — отдельный проект в ./admin со своим конфигом,
// бэкенд — в ./backend. Ничего за пределами ./src сюда не подключается.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
