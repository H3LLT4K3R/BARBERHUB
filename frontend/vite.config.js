import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Agrega esta línea

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Agrega esta línea
  ],
  server: {
    // Permite conectarse desde otros dispositivos en la misma red (ej. un celular),
    // no solo desde localhost.
    host: true,
    proxy: {
      // El frontend llama a rutas relativas "/api/..." (ver utils/api.js);
      // Vite las reenvía al backend Express que corre en el puerto 3000.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})