import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to your GitHub repo name for GitHub Pages deployment
  // Change '/portfolio_v2/' to match your actual repo name
  base: './',
  // Build to docs/ folder for easy GitHub Pages deployment
  build: {
    outDir: 'docs',
  },
})
