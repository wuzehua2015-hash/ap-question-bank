import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  publicDir: false,
  build: {
    outDir: 'dist-admin',
    rolldownOptions: {
      input: {
        admin: 'admin.html',
      },
      checks: {
        pluginTimings: false,
      },
    },
  },
})
