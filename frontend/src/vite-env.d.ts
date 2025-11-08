/// <reference types="vite/client" />

// Vite environment variables type tanımlamaları
// import.meta.env için TypeScript desteği
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string // Backend API URL
  // Diğer environment variable'lar buraya eklenebilir
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

