// vite.config.ts - Vite yapılandırma dosyası
// Vite, hızlı bir build tool ve dev server sağlar

import { defineConfig } from 'vite' // Vite config tanımlama fonksiyonu
import react from '@vitejs/plugin-react' // React plugin - JSX desteği için

// Vite yapılandırmasını dışa aktar
export default defineConfig({
  plugins: [react()], // React plugin'ini aktif et - JSX/TSX desteği

  // Development server ayarları
  server: {
    port: 5173, // Frontend 5173 portunda çalışacak (Vite default)
    open: true, // Tarayıcıyı otomatik aç
    strictPort: false,
    cors: true, // CORS'u aktif et - backend ile iletişim için
  },

  // Build ayarları
  build: {
    outDir: 'dist', // Build çıktı klasörü
    sourcemap: true, // Source map oluştur - debug için
  },

  // Path alias'ları - import yollarını kısaltmak için
  resolve: {
    alias: {
      '@': '/src', // @ ile src klasörüne erişim: import { X } from '@/components/X'
    },
  },
})

