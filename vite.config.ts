import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'wave-demo': resolve(__dirname, 'wave-demo.html'),
      },
    },
  },
  server: {
    open: true,
    port: 5175,
  },
})
