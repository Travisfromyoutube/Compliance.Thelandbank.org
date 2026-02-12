import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — cached long-term, change rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Map libraries — only loaded when visiting /map
          'vendor-map': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
