// SkeletonLoader.tsx - Skeleton loading component'i
// İçerik yüklenirken placeholder gösterir

// Mesaj skeleton'u - mesaj yüklenirken gösterilir
export function MessageSkeleton() {
  return (
    // Mesaj baloncuğu placeholder - gri animasyonlu kutu
    <div className="mb-4">
      <div className="flex justify-start">
        <div className="max-w-[70%] bg-gray-200 rounded-2xl px-4 py-3 animate-pulse">
          {/* 3 satır placeholder */}
          <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-36 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

// Conversation list item skeleton'u
export function ConversationSkeleton() {
  return (
    // Konuşma item placeholder
    <div className="border-b border-gray-200 p-4 animate-pulse">
      {/* Başlık placeholder */}
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      {/* Model ve mesaj sayısı placeholder */}
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  )
}

// Model selector skeleton'u
export function ModelSelectorSkeleton() {
  return (
    // Select placeholder
    <div className="w-64 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
  )
}

