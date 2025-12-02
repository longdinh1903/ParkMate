import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    open: true,
    proxy: {
      "/api": {
        target:
          "http://parkmate-alb-942390189.ap-southeast-1.elb.amazonaws.com", // endpoint backend của bạn
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
