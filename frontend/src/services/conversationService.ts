// services/conversationService.ts - Conversation yönetimi API çağrıları
// Backend'in /api/conversations endpoint'leri ile iletişim

import { api } from './api' // Axios instance
import type { Conversation, CreateConversationRequest } from '@/types'

// Conversation Service - konuşma CRUD işlemleri
export const conversationService = {
  // Tüm konuşmaları listele - GET /api/conversations/
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/api/conversations/')
    return response.data // Konuşma listesini döndür
  },

  // Belirli bir konuşmanın detayını getir - GET /api/conversations/{id}
  async getConversationById(id: number): Promise<Conversation> {
    const response = await api.get<Conversation>(`/api/conversations/${id}`)
    return response.data // Konuşma detayını (mesajlar dahil) döndür
  },

  // Yeni konuşma oluştur - POST /api/conversations/
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const response = await api.post<Conversation>('/api/conversations/', request)
    return response.data // Oluşturulan konuşmayı döndür
  },

  // Konuşma başlığını güncelle - PATCH /api/conversations/{id}
  async updateConversation(id: number, title: string): Promise<Conversation> {
    const response = await api.patch<Conversation>(`/api/conversations/${id}`, { title })
    return response.data // Güncellenmiş konuşmayı döndür
  },

  // Konuşma sil - DELETE /api/conversations/{id}
  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/api/conversations/${id}`)
    // Response yok - sadece silme işlemi başarılı
  },
}

