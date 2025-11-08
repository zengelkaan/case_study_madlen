// store/chatStore.ts - Global state yönetimi (Zustand)
// Tüm uygulama state'i burada yönetilir

import { create } from 'zustand' // Zustand - lightweight state management
import type { Conversation, Message, Model } from '@/types'

// Store state interface - tüm state'lerin type tanımı
interface ChatState {
  // === DATA STATE ===
  conversations: Conversation[] // Tüm konuşmalar listesi
  activeConversationId: number | null // Aktif (seçili) konuşma ID'si
  messages: Message[] // Aktif konuşmanın mesajları
  models: Model[] // Mevcut AI modelleri
  selectedModel: string | null // Seçili model ID'si
  
  // === LOADING STATES ===
  isLoadingConversations: boolean // Konuşmalar yükleniyor mu
  isLoadingMessages: boolean // Mesajlar yükleniyor mu
  isLoadingModels: boolean // Modeller yükleniyor mu
  isSendingMessage: boolean // Mesaj gönderiliyor mu
  isStreaming: boolean // AI cevabı stream olarak geliyor mu - kelime kelime
  
  // === ERROR STATES ===
  error: string | null // Hata mesajı - null ise hata yok
  
  // === TOAST NOTIFICATION ===
  toast: { message: string; type: 'success' | 'error' | 'info' } | null // Toast bildirimi
  
  // === TEMPORARY MODE ===
  isTemporaryMode: boolean // Geçici sohbet modu - true ise database'e kaydetmez
  
  // === ACTIONS - State değiştirme fonksiyonları ===
  
  // Konuşmalar listesini set et
  setConversations: (conversations: Conversation[]) => void
  
  // Aktif konuşmayı değiştir
  setActiveConversation: (id: number | null) => void
  
  // Mesajları set et
  setMessages: (messages: Message[]) => void
  
  // Yeni mesaj ekle - array'e push
  addMessage: (message: Message) => void
  
  // Modelleri set et
  setModels: (models: Model[]) => void
  
  // Seçili modeli değiştir
  setSelectedModel: (modelId: string | null) => void
  
  // Loading state'leri
  setLoadingConversations: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
  setLoadingModels: (loading: boolean) => void
  setSendingMessage: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void // Streaming state - AI cevabı kelime kelime gelirken
  
  // Hata state'i
  setError: (error: string | null) => void
  
  // Toast notification
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void
  
  // Temporary mode
  toggleTemporaryMode: () => void // Temporary mode aç/kapa
  setTemporaryMode: (isTemporary: boolean) => void // Temporary mode set et
  
  // State'i sıfırla - logout veya reset için
  reset: () => void
}

// Initial state - başlangıç değerleri
const initialState = {
  conversations: [], // Boş array
  activeConversationId: null, // Seçili yok
  messages: [], // Boş array
  models: [], // Boş array
  selectedModel: null, // Seçili yok
  isLoadingConversations: false, // Loading yok
  isLoadingMessages: false,
  isLoadingModels: false,
  isSendingMessage: false,
  isStreaming: false, // Streaming yok
  error: null, // Hata yok
  toast: null, // Toast yok
  isTemporaryMode: false, // Temporary mode kapalı - varsayılan normal mode
}

// Zustand store oluştur - global state
export const useChatStore = create<ChatState>((set) => ({
  // Initial state'i yükle
  ...initialState,
  
  // === ACTION IMPLEMENTATIONS ===
  
  // Konuşmaları set et
  setConversations: (conversations) => set({ conversations }),
  
  // Aktif konuşmayı değiştir
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  // Mesajları set et
  setMessages: (messages) => set({ messages }),
  
  // Yeni mesaj ekle - mevcut array'e ekle
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message] // Spread ile yeni array oluştur
  })),
  
  // Modelleri set et
  setModels: (models) => set({ models }),
  
  // Seçili modeli değiştir
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  
  // Loading state setters - tek satırda
  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setLoadingModels: (loading) => set({ isLoadingModels: loading }),
  setSendingMessage: (loading) => set({ isSendingMessage: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }), // Streaming state setter
  
  // Hata state'i set et
  setError: (error) => set({ error }),
  
  // Toast notification göster
  showToast: (message, type) => set({ toast: { message, type } }),
  
  // Toast notification gizle
  hideToast: () => set({ toast: null }),
  
  // Temporary mode toggle - aç/kapa
  toggleTemporaryMode: () => set((state) => ({
    isTemporaryMode: !state.isTemporaryMode, // Toggle et
    messages: [], // Mesajları temizle (yeni mod için temiz başla)
    activeConversationId: null, // Aktif conversation sıfırla
  })),
  
  // Temporary mode set - direkt boolean
  setTemporaryMode: (isTemporary) => set({ 
    isTemporaryMode: isTemporary,
    messages: [], // Mode değişince mesajları temizle
    activeConversationId: null, // Conversation sıfırla
  }),
  
  // State'i sıfırla - initial state'e dön
  reset: () => set(initialState),
}))

