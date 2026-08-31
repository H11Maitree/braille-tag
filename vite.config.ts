import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs work from both https://user.github.io/repository/ and a custom domain.
  base: './',
  plugins: [tailwindcss(), react()],
})
