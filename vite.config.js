import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
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
