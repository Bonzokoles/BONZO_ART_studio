import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5853,
        host: '0.0.0.0',
        proxy: {
          '/api-fal-rest': {
            target: 'https://api.fal.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-fal-rest/, ''),
          },
          '/api-fal': {
            target: 'https://fal.run',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-fal/, ''),
          },
          '/api-replicate': {
            target: 'https://api.replicate.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-replicate/, ''),
          },
          '/api-openai': {
            target: 'https://api.openai.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-openai/, ''),
          },
          '/api-google': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-google/, ''),
          },
          '/api-pollinations': {
            target: 'https://image.pollinations.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-pollinations/, ''),
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.FAL_KEY': JSON.stringify(env.FAL_KEY),
        'process.env.REPLICATE_API_TOKEN': JSON.stringify(env.REPLICATE_API_TOKEN),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
