import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getUrlToSrcMap } from './src/lib/config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: getUrlToSrcMap(),
      output: {
        // workaround for aggregated global css file having empty [extname]
        // and thus tripping up Cloudflare because it depends on extension for mime-type
        assetFileNames: (assetInfo) => {
          const isCss =
            assetInfo.name?.endsWith(".css") ||
            assetInfo.originalFileNames?.some((f) => f.endsWith(".css"));

          if (isCss) return "assets/[hash].css";
          return "assets/[hash][extname]";
        },
      },
    },
  },
})
