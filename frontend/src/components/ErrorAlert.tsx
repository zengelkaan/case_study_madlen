// ErrorAlert.tsx - Hata mesajı gösterme component'i
// API hatalarını kullanıcıya user-friendly şekilde gösterir

interface ErrorAlertProps {
  message: string // Hata mesajı - kullanıcıya gösterilecek
  onClose?: () => void // Kapatma callback'i - opsiyonel
}

// Hata alert component'i - kırmızı arka planlı bildirim
export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    // Container - kırmızı arka plan ve border
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      {/* İçerik wrapper - flex layout */}
      <div className="flex items-start justify-between">
        {/* Sol taraf - ikon ve mesaj */}
        <div className="flex items-start">
          {/* Hata ikonu - ❌ emoji */}
          <span className="text-red-600 text-xl mr-3">⚠️</span>
          
          {/* Hata mesajı */}
          <div>
            <p className="text-red-800 font-medium">Hata</p>
            <p className="text-red-700 text-sm mt-1">{message}</p>
          </div>
        </div>
        
        {/* Sağ taraf - kapatma butonu (varsa) */}
        {onClose && (
          <button
            onClick={onClose} // Kapatma fonksiyonu
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Kapat" // Accessibility için
          >
            {/* X ikonu */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

