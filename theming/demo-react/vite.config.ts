import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: '/tailwind-dev',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'js-tailwind-compiled': 'js-tailwind-compiled.html',
        'js-tailwind-dev': 'js-tailwind-dev.html',
        'js': 'js.html',
        'mui': 'mui.html',
        'mui-tailwind-compiled': 'mui-tailwind-compiled.html',
        'mui-tailwind-dev': 'mui-tailwind-dev.html',
        'shadcn': 'shadcn.html',
        'shadcn-compiled': 'shadcn-compiled.html',
        'shadcn-dev': 'shadcn-dev.html',
        'tailwind-compiled': 'tailwind-compiled.html',
        'tailwind-dev': 'tailwind-dev.html',
      },
    },
  },
})
