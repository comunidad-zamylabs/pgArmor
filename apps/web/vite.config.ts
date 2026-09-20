import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind 0.0.0.0 (container-reachable)
    watch: {
      // Polling default ON: Docker Desktop (macOS/Windows) does not emit
      // native fs events through bind mounts. Set CHOKIDAR_USEPOLLING=false
      // in .env for lower CPU on native Linux.
      usePolling: process.env.CHOKIDAR_USEPOLLING !== 'false',
    },
    proxy: {
      '/api': {
        target: 'http://server:3000', // compose service DNS
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
