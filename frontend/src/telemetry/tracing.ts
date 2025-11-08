// telemetry/tracing.ts - Tracing utility fonksiyonları
// User interaction'ları ve operasyonları trace etmek için helper'lar

import { getTracer } from './telemetry'

// Global tracer - frontend işlemleri için
const tracer = getTracer('frontend-user-interactions')

// Button click'i trace et - kullanıcı etkileşimi
export function traceButtonClick(buttonName: string, metadata?: Record<string, any>) {
  // Yeni span başlat
  const span = tracer.startSpan(`button.click.${buttonName}`)
  
  // Span'e attribute ekle - button adı
  span.setAttribute('button.name', buttonName)
  span.setAttribute('interaction.type', 'click')
  
  // Ek metadata varsa ekle
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      span.setAttribute(key, String(value)) // Tüm metadata'yı attribute olarak ekle
    })
  }
  
  // Span'i hemen bitir - click instant bir işlem
  span.end()
}

// Mesaj gönderme işlemini trace et
export async function traceMessageSend<T>(
  messageContent: string, // Gönderilen mesaj
  model: string, // Kullanılan model
  operation: () => Promise<T> // Asenkron işlem (API çağrısı)
): Promise<T> {
  // Yeni span başlat - mesaj gönderme işlemi
  const span = tracer.startSpan('message.send')
  
  // Span'e attribute ekle - mesaj ve model bilgisi
  span.setAttribute('message.length', messageContent.length) // Mesaj uzunluğu
  span.setAttribute('message.model', model) // Kullanılan model
  span.setAttribute('interaction.type', 'message_send')
  
  try {
    const result = await operation() // İşlemi çalıştır (API çağrısı)
    
    // Başarılı - span'e success attribute ekle
    span.setAttribute('message.status', 'success')
    
    return result // Sonucu döndür
  } catch (error: any) {
    // Hata durumu - span'e error ekle
    span.setAttribute('message.status', 'error')
    span.setAttribute('error.message', error.detail || String(error))
    span.recordException(error) // Exception'ı trace'e kaydet
    
    throw error // Hatayı yukarı fırlat
  } finally {
    span.end() // Span'i bitir
  }
}

// Conversation seçme işlemini trace et
export function traceConversationSwitch(conversationId: number, conversationTitle: string) {
  // Yeni span başlat
  const span = tracer.startSpan('conversation.switch')
  
  // Span'e attribute ekle
  span.setAttribute('conversation.id', conversationId) // Conversation ID
  span.setAttribute('conversation.title', conversationTitle) // Conversation başlığı
  span.setAttribute('interaction.type', 'conversation_switch')
  
  // Span'i bitir - instant işlem
  span.end()
}

// Conversation silme işlemini trace et
export async function traceConversationDelete<T>(
  conversationId: number,
  operation: () => Promise<T> // Silme işlemi (API çağrısı)
): Promise<T> {
  // Yeni span başlat
  const span = tracer.startSpan('conversation.delete')
  
  // Span'e attribute ekle
  span.setAttribute('conversation.id', conversationId)
  span.setAttribute('interaction.type', 'conversation_delete')
  
  try {
    const result = await operation() // Silme işlemini çalıştır
    span.setAttribute('conversation.delete.status', 'success')
    return result
  } catch (error: any) {
    span.setAttribute('conversation.delete.status', 'error')
    span.recordException(error)
    throw error
  } finally {
    span.end()
  }
}

// Yeni conversation oluşturma işlemini trace et
export function traceNewConversation() {
  // Yeni span başlat
  const span = tracer.startSpan('conversation.new')
  
  // Span'e attribute ekle
  span.setAttribute('interaction.type', 'new_conversation')
  
  // Span'i bitir
  span.end()
}

// Model seçme işlemini trace et
export function traceModelSelect(modelId: string, modelName: string) {
  // Yeni span başlat
  const span = tracer.startSpan('model.select')
  
  // Span'e attribute ekle
  span.setAttribute('model.id', modelId) // Model ID
  span.setAttribute('model.name', modelName) // Model adı
  span.setAttribute('interaction.type', 'model_select')
  
  // Span'i bitir
  span.end()
}

