// services/chatService.ts - Chat ile ilgili API çağrıları
// Backend'in /api/chat endpoint'leri ile iletişim

import { api } from './api' // Axios instance
import type { ChatRequest, ChatResponse } from '@/types'

// Chat Service - mesaj gönderme ve düzenleme işlemleri
export const chatService = {
  // Mesaj gönder - POST /api/chat/send
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/api/chat/send', request)
    return response.data // AI'dan gelen cevabı döndür
  },

  // Mesaj düzenle - PUT /api/chat/messages/{id}
  async editMessage(messageId: number, content: string): Promise<any> {
    const response = await api.put(`/api/chat/messages/${messageId}`, { content })
    return response.data // Güncellenmiş mesaj bilgisi
  },

  // Mesaj gönder (streaming mode) - POST /api/chat/stream
  // AI cevabı kelime kelime gelir - gerçek zamanlı typing effect
  async sendMessageStream(
    request: ChatRequest, 
    onChunk: (chunk: string) => void // Her kelime parçası geldiğinde çağrılır
  ): Promise<number> { // Conversation ID döndürür
    // Axios streaming desteklemiyor - fetch API kullan
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    
    // Fetch ile POST request - streaming için
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST', // POST request
      headers: {
        'Content-Type': 'application/json', // JSON body
      },
      body: JSON.stringify(request), // Request body'yi JSON'a çevir
    })
    
    // Response başarısız mı kontrol et
    if (!response.ok) {
      throw new Error(`Streaming hatası: ${response.statusText}`)
    }
    
    // Response body'den reader al - stream okumak için
    const reader = response.body?.getReader() // ReadableStream reader
    const decoder = new TextDecoder() // Text decoder - byte'ları string'e çevir
    
    if (!reader) {
      throw new Error('Stream reader alınamadı')
    }
    
    // Stream'i oku - parça parça
    let conversationId = 0 // Conversation ID - header'dan gelecek
    
    // Response header'dan conversation ID'yi al (opsiyonel)
    const convIdHeader = response.headers.get('X-Conversation-Id')
    if (convIdHeader) {
      conversationId = parseInt(convIdHeader) // Header'dan conversation ID
    }
    
    // Stream'den chunk'ları oku
    while (true) {
      const { done, value } = await reader.read() // Bir chunk oku
      
      if (done) break // Stream bitti
      
      // Byte array'i string'e çevir
      const chunk = decoder.decode(value, { stream: true })
      
      // Her chunk geldiğinde callback çağır - UI güncellensin
      onChunk(chunk)
    }
    
    return conversationId // Conversation ID döndür
  },
}

