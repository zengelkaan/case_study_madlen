// api.types.ts - API ile ilgili TypeScript type tanımlamaları
// Backend'den gelen ve giden verilerin type'larını tanımlar

// Model (AI modeli) type'ı
export interface Model {
  id: string // Model ID - örn: "nvidia/nemotron-nano-9b-v2:free"
  name: string // Model adı - kullanıcıya gösterilecek
  description?: string // Model açıklaması - opsiyonel
  context_length?: number // Max token sayısı - opsiyonel
  supportsVision?: boolean // Resim/görsel desteği var mı - vision model'ler için true
  pricing?: {
    prompt: number // Prompt başına ücret ($/1M token)
    completion: number // Completion başına ücret ($/1M token)
    average: number // Ortalama maliyet ($/1M token)
  } // Fiyat bilgileri - opsiyonel
  is_free?: boolean // Ücretsiz model mi - true ise ücretsiz
}

// Message (Sohbet mesajı) type'ı
export interface Message {
  id: number // Mesaj ID - database'den gelir
  conversation_id: number // Hangi konuşmaya ait
  role: 'user' | 'assistant' // Mesajı kim gönderdi
  content: string // Mesaj içeriği
  model_name?: string // Bu mesajı oluşturan AI model - sadece assistant mesajlarında (opsiyonel)
  image_url?: string // Resim URL'i veya base64 - vision model'ler için (opsiyonel)
  timestamp: string // Gönderim zamanı - ISO 8601 formatı
}

// Conversation (Konuşma) type'ı
export interface Conversation {
  id: number // Konuşma ID
  title: string // Konuşma başlığı
  model_name: string // Hangi model kullanıldı
  created_at: string // Oluşturulma zamanı - ISO 8601 formatı
  message_count?: number // Mesaj sayısı - liste görünümünde
  messages?: Message[] // Mesajlar - detay görünümünde
}

// Chat request - Mesaj gönderme
export interface ChatRequest {
  model: string // Kullanılacak model ID
  message: string // Gönderilecek mesaj
  image_url?: string // Resim URL'i veya base64 - vision model'ler için (opsiyonel)
  is_temporary?: boolean // Geçici sohbet mi - true ise database'e kaydedilmez (opsiyonel, default: false)
  conversation_id?: number // Mevcut konuşma ID'si - opsiyonel (temporary mode'da negatif olabilir)
  conversation_title?: string // Yeni konuşma başlığı - opsiyonel
}

// Chat response - AI'dan gelen cevap
export interface ChatResponse {
  conversation_id: number // Konuşma ID
  message: string // AI'dan gelen cevap
  model: string // Kullanılan model
  timestamp: string // Mesaj zamanı - ISO 8601 formatı
}

// Conversation oluşturma request'i
export interface CreateConversationRequest {
  title: string // Konuşma başlığı
  model_name: string // Kullanılacak model
}

// API hata yanıtı
export interface ApiError {
  detail: string // Hata mesajı
  status?: number // HTTP status kodu
}

// Generic API response - sayfalama için
export interface PaginatedResponse<T> {
  data: T[] // Veri listesi
  total: number // Toplam kayıt sayısı
  page: number // Mevcut sayfa
  page_size: number // Sayfa başına kayıt
}

