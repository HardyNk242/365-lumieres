import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // GitHub Pages serves the site under https://<user>.github.io/365-lumieres/
      // so every built asset must be prefixed with that subpath. Without this,
      // /assets/index-XXX.js resolves to the wrong URL and the React bundle
      // 404s — the page renders only the Tailwind body background and nothing
      // else (the visible "brown blank page" symptom).
      base: '/365-lumieres/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
