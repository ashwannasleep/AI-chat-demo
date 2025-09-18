// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: replace <repo> with your repo name
export default defineConfig({
  plugins: [react()],
  base: '/AI-chat-demo/', 
})
