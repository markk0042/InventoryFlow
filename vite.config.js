import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Set to '/inventory-flow/' etc. when deploying to a subpath
})
