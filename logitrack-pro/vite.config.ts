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
        allowedHosts: true,          // 允许所有 Host 头（含外部代理转发的 210.184.51.237）
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
          },
          '/pyapi': {
            // Python FastAPI monitor API (email-ai-automation)
            target: 'http://localhost:5100',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      preview: {
        port: 3000,
        host: true,
        strictPort: true,
        allowedHosts: true,          // 允许所有 Host 头（含外部代理转发的 210.184.51.237）
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: false,
          },
          '/pyapi': {
            target: 'http://localhost:5100',
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
