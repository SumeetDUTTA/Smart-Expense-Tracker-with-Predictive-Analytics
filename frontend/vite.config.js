import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target:
            mode === 'development'
              ? 'http://localhost:5000'
              : 'https://expense-keeper-backend.onrender.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
