// ErrorBoundary.tsx - React Error Boundary component'i
// Uygulama çökmelerini yakalar ve kullanıcı dostu hata gösterir

import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode // Korunacak child component'ler
}

interface ErrorBoundaryState {
  hasError: boolean // Hata oluştu mu
  error: Error | null // Hata objesi
}

// Error Boundary class component - React'in resmi pattern'i
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    // Initial state - hata yok
    this.state = {
      hasError: false,
      error: null,
    }
  }
  
  // React'in özel metodu - hata yakalandığında çağrılır
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // State'i güncelle - hata var
    return {
      hasError: true,
      error: error,
    }
  }
  
  // Hata detaylarını logla - production'da error tracking servisine gönderilir
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ React Error Boundary yakaladı:', error, errorInfo)
    // Future: Sentry, LogRocket gibi servislere gönder
  }
  
  // Sayfayı yenile - hata durumundan kurtul
  handleReload = () => {
    window.location.reload() // Sayfayı yeniden yükle
  }
  
  render() {
    // Hata varsa - error UI göster
    if (this.state.hasError) {
      return (
        // Error screen - ortaya hizalı
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Hata ikonu */}
            <div className="text-6xl mb-4">😔</div>
            
            {/* Başlık */}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Bir şeyler ters gitti
            </h1>
            
            {/* Açıklama */}
            <p className="text-gray-600 mb-6">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            
            {/* Hata mesajı - development ortamında göster */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 p-3 rounded mb-4 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            
            {/* Yenileme butonu */}
            <button
              onClick={this.handleReload}
              className="btn btn-primary px-6 py-3"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }
    
    // Hata yoksa - normal render
    return this.props.children
  }
}

