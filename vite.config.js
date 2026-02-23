import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/wordfuse/', // Make sure this matches your repo name exactly
  plugins: [react(), tailwindcss()],
})


