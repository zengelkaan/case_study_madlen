// LoadingIndicator.tsx - Yüklenme göstergesi component'i
// API çağrıları sırasında kullanıcıya yükleniyor feedback'i verir

interface LoadingIndicatorProps {
  message?: string // Opsiyonel yükleme mesajı - örn: "Mesajlar yükleniyor..."
}

// Loading spinner component'i
export function LoadingIndicator({ message = 'Yükleniyor...' }: LoadingIndicatorProps) {
  return (
    // Container - ortaya hizalı
    <div className="flex flex-col items-center justify-center p-8">
      {/* Spinner animasyonu - CSS ile dönen daire */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      
      {/* Yükleme mesajı */}
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  )
}

