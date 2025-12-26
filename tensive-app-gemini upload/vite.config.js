import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to network (0.0.0.0)
    proxy: {
      // Proxy function calls to Netlify Dev server
      '/.netlify/functions': 'http://localhost:8888'
    }
  }
})
