import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
// import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),crx({ manifest })],
  // resolve: {
  //   extensions: ['.js', '.jsx'],
  //   alias: {
  //     '@': path.resolve(__dirname, './src'),
  //   },
  // },
})
