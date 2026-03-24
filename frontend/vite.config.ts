import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split plotly into its own lazy chunk — doesn't block initial render
          plotly: ['plotly.js-dist-min'],
          // Split react into its own chunk for better caching
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 6000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
