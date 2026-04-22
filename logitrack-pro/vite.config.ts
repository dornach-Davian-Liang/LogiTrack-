import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080';
    const frontendPublicHost = '210.184.51.237';
    return {
      server: {
        port: 3000,
        host: true,
        strictPort: true,
        hmr: {
          host: frontendPublicHost,
          port: 3000,
          protocol: 'ws'
        },
        proxy: {
          '/api': {
            // Backend default: 8080 (override with VITE_API_TARGET)
            target: apiTarget,
            changeOrigin: true,
            secure: false,
          }
        }
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
