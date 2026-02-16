import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify CSS
    cssMinify: true,
    // Use terser for better JS minification
    minify: 'esbuild',
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-chart': ['chart.js', 'react-chartjs-2'],
          'vendor-calendar': [
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list',
            '@fullcalendar/timegrid',
            '@fullcalendar/core'
          ],
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'esnext',
    // Remove console.log in production
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
