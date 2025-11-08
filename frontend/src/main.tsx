// main.tsx - Uygulama giriş noktası
// React uygulaması burada başlatılır ve DOM'a render edilir

import React from 'react' // React kütüphanesi
import ReactDOM from 'react-dom/client' // React DOM - tarayıcıya render için
import App from './App' // Ana uygulama component'i
import './styles/index.css' // Global CSS ve Tailwind CSS
import { setupTelemetry } from './telemetry' // OpenTelemetry setup
import { ErrorBoundary } from './components' // Error boundary - uygulama crash'lerini yakalar

// OpenTelemetry'yi başlat - uygulama başlamadan önce
setupTelemetry()

// Root element'i seç - index.html'deki <div id="root">
const rootElement = document.getElementById('root')

// Root element yoksa hata ver - güvenlik kontrolü
if (!rootElement) {
  throw new Error('Root element bulunamadı!')
}

// React uygulamasını oluştur ve DOM'a render et
ReactDOM.createRoot(rootElement).render(
  // StrictMode - geliştirme ortamında ekstra kontroller yapar
  <React.StrictMode>
    {/* ErrorBoundary - uygulama crash'lerini yakalar */}
    <ErrorBoundary>
      <App /> {/* Ana uygulama component'i */}
    </ErrorBoundary>
  </React.StrictMode>
)

