// MessageList.tsx - Mesaj listesi component'i
// Sohbetteki tüm mesajları gösterir ve otomatik en alta scroll yapar

import { useEffect, useRef } from 'react'
import type { Message } from '@/types'
import { MessageBubble } from './MessageBubble'
import { EmptyState } from './EmptyState'

interface MessageListProps {
  messages: Message[] // Gösterilecek mesaj listesi
  loading?: boolean // Yükleniyor mu - opsiyonel
  modelName?: string // Seçili model adı - Artık kullanılmıyor (mesajlar kendi model_name'lerini taşıyor)
  onEditMessage?: (messageId: number, newContent: string) => Promise<void> // Mesaj düzenleme callback
}

// Mesaj listesi component'i - scroll container
export function MessageList({ messages, loading = false, onEditMessage }: MessageListProps) {
  // Scroll container referansı - en alta scroll yapmak için
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom fonksiyonu - yeni mesaj geldiğinde en alta kaydır
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) // Yumuşak animasyonlu scroll
  }
  
  // Messages değiştiğinde en alta scroll yap - useEffect ile
  useEffect(() => {
    scrollToBottom() // Her yeni mesajda
  }, [messages]) // Dependency - messages değişince çalışır
  
  return (
    // Mesaj container - parent'ta scroll var, burada sadece içerik, dark mode desteği
    <div className="p-4 space-y-2 min-h-full bg-white dark:bg-gray-900 transition-colors overflow-x-hidden">
      {/* Mesaj yok ve loading değilse - empty state göster */}
      {messages.length === 0 && !loading && (
        <EmptyState
          icon="💬"
          title="Henüz mesaj yok"
          description="İlk mesajınızı göndererek sohbete başlayın!"
        />
      )}
      
      {/* Mesajları listele - map ile */}
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} // Unique key - React render optimizasyonu için
          message={message} // Mesaj objesi - model_name message içinde
          onEdit={onEditMessage} // Edit callback'i geç
        />
      ))}
      
      {/* Loading durumu - AI cevap verirken */}
      {loading && (
        <div className="flex justify-start mb-4 group animate-fade-in px-4">
          <div className="flex items-start gap-3">
            {/* AI Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-0.5">
                <path d="M100 20C91.7157 20 85 26.7157 85 35V45C85 53.2843 91.7157 60 100 60C108.284 60 115 53.2843 115 45V35C115 26.7157 108.284 20 100 20Z" fill="#D97706"/>
                <path d="M70 50C61.7157 50 55 56.7157 55 65V75C55 83.2843 61.7157 90 70 90C78.2843 90 85 83.2843 85 75V65C85 56.7157 78.2843 50 70 50Z" fill="#D97706"/>
                <path d="M130 50C121.716 50 115 56.7157 115 65V75C115 83.2843 121.716 90 130 90C138.284 90 145 83.2843 145 75V65C145 56.7157 138.284 50 130 50Z" fill="#D97706"/>
                <path d="M40 90C40 81.7157 46.7157 75 55 75H145C153.284 75 160 81.7157 160 90V160C160 168.284 153.284 175 145 175H55C46.7157 175 40 168.284 40 160V90Z" fill="#D97706"/>
                <rect x="65" y="110" width="25" height="35" rx="5" fill="white"/>
                <rect x="110" y="110" width="25" height="35" rx="5" fill="white"/>
                <path d="M75 125C75 122.239 77.2386 120 80 120C82.7614 120 85 122.239 85 125V130C85 132.761 82.7614 135 80 135C77.2386 135 75 132.761 75 130V125Z" fill="#D97706"/>
                <path d="M115 125C115 122.239 117.239 120 120 120C122.761 120 125 122.239 125 125V130C125 132.761 122.761 135 120 135C117.239 135 115 132.761 115 130V125Z" fill="#D97706"/>
              </svg>
            </div>
            
            {/* Typing indicator - 3 nokta animasyonu */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scroll anchor - en alt nokta, buraya scroll yapılır */}
      <div ref={messagesEndRef} />
    </div>
  )
}

