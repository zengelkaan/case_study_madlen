// hooks/useChat.ts - Chat işlemleri custom hook'u
// Mesaj gönderme ve mesaj geçmişi yükleme

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { chatService, conversationService } from '@/services'
import type { ChatRequest, Message } from '@/types'
import { traceMessageSend } from '@/telemetry' // Tracing utility

// Chat işlemleri hook'u
export function useChat() {
  // Store'dan state ve action'ları al
  const activeConversationId = useChatStore((state) => state.activeConversationId) // Aktif conversation
  const messages = useChatStore((state) => state.messages) // Mesaj listesi
  const selectedModel = useChatStore((state) => state.selectedModel) // Seçili model
  const isSending = useChatStore((state) => state.isSendingMessage) // Mesaj gönderiliyor mu
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages) // Mesajlar yükleniyor mu
  const isTemporaryMode = useChatStore((state) => state.isTemporaryMode) // Geçici sohbet modu - database'e kaydedilmez
  
  const setMessages = useChatStore((state) => state.setMessages) // Mesajları set et
  const addMessage = useChatStore((state) => state.addMessage) // Mesaj ekle
  const setSending = useChatStore((state) => state.setSendingMessage) // Sending state
  const setLoadingMessages = useChatStore((state) => state.setLoadingMessages) // Loading state
  const setError = useChatStore((state) => state.setError) // Error state
  const setActiveConversation = useChatStore((state) => state.setActiveConversation) // Aktif conversation set et - YENİ conversation oluşturulduğunda kullanılacak
  const setStreaming = useChatStore((state) => state.setStreaming) // Streaming state - AI cevabı stream olarak gelirken
  
  // Aktif conversation'ın mesajlarını yükle
  const loadMessages = async (conversationId: number) => {
    setLoadingMessages(true) // Loading başlat
    setError(null) // Hataları temizle
    
    try {
      // Conversation detayını al - mesajlar dahil
      const conversation = await conversationService.getConversationById(conversationId)
      setMessages(conversation.messages || []) // Mesajları store'a kaydet
    } catch (err: any) {
      setError(err.detail || 'Mesajlar yüklenemedi')
      console.error('Mesaj yükleme hatası:', err)
    } finally {
      setLoadingMessages(false) // Loading bitir
    }
  }
  
  // Mesaj gönder - AI'a gönder ve cevabı al
  const sendMessage = async (message: string, conversationTitle?: string) => {
    // Model seçilmemişse hata ver
    if (!selectedModel) {
      setError('Lütfen bir model seçin')
      return
    }
    
    setSending(true) // Sending başlat
    setError(null) // Hataları temizle
    
    // Optimistic update - kullanıcı mesajını hemen ekranda göster
    const userMessage: Message = {
      id: Date.now(), // Geçici ID - timestamp kullan
      conversation_id: activeConversationId || 0, // Aktif conversation ID (yoksa 0)
      role: 'user', // Kullanıcı mesajı
      content: message, // Mesaj içeriği
      timestamp: new Date().toISOString(), // Şu anki zaman
    }
    addMessage(userMessage) // Hemen ekranda göster - optimistic update
    
    try {
      // Chat request oluştur
      const request: ChatRequest = {
        model: selectedModel, // Seçili model
        message: message, // Kullanıcının mesajı
        conversation_id: activeConversationId || undefined, // Aktif conversation (varsa)
        conversation_title: conversationTitle, // Yeni conversation için başlık (varsa)
      }
      
      // Backend'e gönder - AI cevabını al (tracing ile)
      const response = await traceMessageSend(
        message, // Mesaj içeriği
        selectedModel, // Model ID
        () => chatService.sendMessage(request) // API çağrısı - trace edilecek
      )
      
      // Yeni conversation oluşturulduysa - aktif conversation'ı güncelle
      // Bu çok önemli! Aksi halde her mesajda yeni conversation oluşturulur
      if (response.conversation_id && !activeConversationId) {
        setActiveConversation(response.conversation_id) // Yeni conversation'ı aktif yap - context korunur
      }
      
      // AI cevabını ekle - backend'den gelen response.message
      const aiMessage: Message = {
        id: Date.now() + 1, // Geçici ID - timestamp + 1 (kullanıcı mesajından sonra)
        conversation_id: response.conversation_id, // Conversation ID
        role: 'assistant', // AI mesajı
        content: response.message, // AI cevabı
        timestamp: response.timestamp, // Backend'den gelen timestamp
      }
      addMessage(aiMessage) // AI cevabını ekle - optimistic update
      
      // Mesajları yeniden yükle - backend'den güncel liste için (optimistic update'i doğrula)
      // Bu, backend'den gelen gerçek mesajlar ile optimistic update'teki geçici mesajları senkronize eder
      if (response.conversation_id) {
        await loadMessages(response.conversation_id) // Backend'den tüm mesajları yükle
      }
      
    } catch (err: any) {
      // Hata durumunda - optimistic update'i geri al (kullanıcı mesajını kaldır)
      const currentMessages = useChatStore.getState().messages // Mevcut mesajlar
      setMessages(currentMessages.filter((m) => m.id !== userMessage.id)) // Geçici mesajı kaldır
      setError(err.detail || 'Mesaj gönderilemedi')
      console.error('Mesaj gönderme hatası:', err)
    } finally {
      setSending(false) // Sending bitir
    }
  }
  
  // Mesaj gönder (streaming mode) - AI cevabı kelime kelime gelir, resim desteği ile
  const sendMessageStream = async (message: string, conversationTitle?: string, imageBase64?: string) => {
    // Model seçilmemişse hata ver
    if (!selectedModel) {
      setError('Lütfen bir model seçin')
      return
    }
    
    setSending(true) // Sending başlat
    setStreaming(true) // Streaming başlat - AI cevabı gelmeye başlıyor
    setError(null) // Hataları temizle
    
    // Optimistic update - kullanıcı mesajını hemen ekranda göster (resim ile birlikte)
    const userMessage: Message = {
      id: Date.now(), // Geçici ID - timestamp kullan
      conversation_id: activeConversationId || 0, // Aktif conversation ID (yoksa 0)
      role: 'user', // Kullanıcı mesajı
      content: message, // Mesaj içeriği
      image_url: imageBase64, // Resim base64 (varsa) - preview için
      timestamp: new Date().toISOString(), // Şu anki zaman
    }
    addMessage(userMessage) // Hemen ekranda göster - optimistic update (resim ile birlikte)
    
    // AI mesajı için geçici placeholder oluştur - stream içeriğini doldurmak için
    const aiMessageId = Date.now() + 1 // Geçici ID
    const aiMessage: Message = {
      id: aiMessageId, // Geçici ID
      conversation_id: activeConversationId || 0, // Conversation ID
      role: 'assistant', // AI mesajı
      content: '', // Başlangıçta boş - stream doldurur
      timestamp: new Date().toISOString(), // Şu anki zaman
    }
    addMessage(aiMessage) // Boş AI mesajı ekle - stream dolduracak
    
    try {
      let fullContent = '' // Tüm AI cevabını biriktir
      
      // Streaming başlat - her chunk geldiğinde callback çağrılır
      const conversationId = await chatService.sendMessageStream(
        // Request oluştur - inline (fullContent sonrası hesaplayacağız)
        {
          model: selectedModel,
          message: message,
          image_url: imageBase64,
          is_temporary: isTemporaryMode,
          conversation_id: activeConversationId || undefined,
          conversation_title: conversationTitle,
        },
        (chunk: string) => {
          // Her chunk geldiğinde - AI cevabını güncelle
          fullContent += chunk // Chunk'ı biriktir
          
          // AI mesajını güncelle - mevcut mesajları al, AI mesajını bul, content'ini güncelle
          const currentMessages = useChatStore.getState().messages
          const updatedMessages = currentMessages.map((m) =>
            m.id === aiMessageId
              ? { ...m, content: fullContent } // AI mesajının content'ini güncelle - stream içeriği
              : m
          )
          setMessages(updatedMessages) // Güncel mesajları set et - UI'da görünür
        }
      )
      
      // Backend'den conversation ID geldi mi kontrol et
      // Not: Backend her zaman conversation ID döner (yeni veya mevcut)
      // conversationId > 0 ise geçerli bir ID (0 veya undefined değil)
      if (conversationId && conversationId > 0) {
        // Backend'den gelen ID ile aktif ID farklıysa güncelle
        if (conversationId !== activeConversationId) {
          setActiveConversation(conversationId) // Conversation ID'yi güncelle
        }
      }
      
      // Stream bitti - mesajları yükle
      if (!isTemporaryMode && (conversationId || activeConversationId)) {
        // NORMAL MODE: Backend'den gerçek mesajları yükle - database'den
        await loadMessages(conversationId || activeConversationId!)
      }
      // TEMPORARY MODE: Mesajları yükleme - zaten memory'de optimistic update var
      
    } catch (err: any) {
      // Hata durumunda - optimistic update'leri geri al
      const currentMessages = useChatStore.getState().messages
      setMessages(currentMessages.filter((m) => m.id !== userMessage.id && m.id !== aiMessageId)) // Geçici mesajları kaldır
      setError(err.message || 'Mesaj gönderilemedi')
      console.error('Streaming hatası:', err)
    } finally {
      setSending(false) // Sending bitir
      setStreaming(false) // Streaming bitir
    }
  }
  
  // Aktif conversation değiştiğinde mesajları yükle - useEffect
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId) // Mesajları getir
    } else {
      setMessages([]) // Aktif conversation yoksa mesajları temizle
    }
  }, [activeConversationId]) // Dependency - aktif conversation değişince
  
  // Mesaj düzenle ve yeniden gönder
  const editAndResendMessage = async (messageId: number, newContent: string) => {
    if (!selectedModel) {
      setError('Lütfen bir model seçin')
      return
    }
    
    if (!activeConversationId) {
      setError('Aktif conversation bulunamadı')
      return
    }
    
    // Edit yapılırken yeni mesaj göndermeyi engelle
    if (isSending) return
    
    setSending(true)
    setStreaming(true)
    setError(null)
    
    try {
      // 1. Backend'de mesajı güncelle ve sonraki mesajları sil
      await chatService.editMessage(messageId, newContent)
      
      // 2. UI'da da aynısını yap - sonraki mesajları sil, edit edilmiş mesajı güncelle
      const currentMessages = useChatStore.getState().messages
      const editIndex = currentMessages.findIndex(m => m.id === messageId)
      
      if (editIndex === -1) {
        // Mesaj bulunamadı - backend'den yükle
        await loadMessages(activeConversationId)
        return
      }
      
      // Sadece edit edilmiş mesaja kadar olan mesajları tut
      const messagesUntilEdit = currentMessages.slice(0, editIndex + 1)
      messagesUntilEdit[editIndex] = { ...messagesUntilEdit[editIndex], content: newContent }
      setMessages(messagesUntilEdit)
      
      // 3. AI cevabını stream et
      const tempAiId = -Date.now()
      const placeholderMessage: Message = {
        id: tempAiId,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: '',
        model_name: selectedModel, // Model adını ekle - UI'da gösterilsin
        timestamp: new Date().toISOString(),
      }
      addMessage(placeholderMessage)
      
      let streamContent = ''
      
      await chatService.sendMessageStream(
        {
          model: selectedModel,
          message: newContent,
          conversation_id: activeConversationId,
        },
        (chunk: string) => {
          streamContent += chunk
          const current = useChatStore.getState().messages
          setMessages(current.map(m => 
            m.id === tempAiId ? { ...m, content: streamContent } : m
          ))
        }
      )
      
      // 4. Stream bitti - Backend sync için loadMessages ÇAĞIRMA
      // Çünkü duplicate oluyor. Optimistic update yeterli.
      // Not: Placeholder'da model_name yok ama bu bir trade-off
      // Kullanıcı conversation'ı tekrar seçerse loadMessages ile güncellenecek
      
    } catch (err: any) {
      setError(err.detail || 'Mesaj düzenlenemedi')
      console.error('Mesaj düzenleme hatası:', err)
      if (activeConversationId) {
        await loadMessages(activeConversationId)
      }
    } finally {
      setSending(false)
      setStreaming(false)
    }
  }
  
  // Hook'un döndürdüğü değerler ve fonksiyonlar
  return {
    messages, // Mesaj listesi
    selectedModel, // Seçili model
    isSending, // Mesaj gönderiliyor mu
    isLoadingMessages, // Mesajlar yükleniyor mu
    sendMessage, // Mesaj gönder fonksiyonu (normal mode)
    sendMessageStream, // Mesaj gönder fonksiyonu (streaming mode) - kelime kelime
    loadMessages, // Mesajları yükle fonksiyonu (manual refresh için)
    editAndResendMessage, // Mesaj düzenle ve yeniden gönder
  }
}

