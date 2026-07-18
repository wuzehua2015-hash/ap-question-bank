import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/html2canvas')) return 'pdf-html2canvas'
          if (id.includes('node_modules/jspdf')) return 'pdf-jspdf'
        },
      },
    },
  },
})
