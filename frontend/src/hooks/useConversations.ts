// hooks/useConversations.ts - Konuşma listesi yönetimi custom hook'u
// Konuşmaları yükler, seçer ve siler

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { conversationService } from '@/services'
import { traceConversationSwitch, traceConversationDelete } from '@/telemetry' // Tracing utilities

// Konuşma yönetimi hook'u
export function useConversations() {
  // Store'dan state ve action'ları al
  const conversations = useChatStore((state) => state.conversations) // Konuşma listesi
  const activeConversationId = useChatStore((state) => state.activeConversationId) // Aktif konuşma ID
  const isLoading = useChatStore((state) => state.isLoadingConversations) // Loading state
  const setConversations = useChatStore((state) => state.setConversations) // Set action
  const setActiveConversation = useChatStore((state) => state.setActiveConversation) // Aktif conversation set
  const setLoading = useChatStore((state) => state.setLoadingConversations) // Loading action
  const setError = useChatStore((state) => state.setError) // Error action
  const showToast = useChatStore((state) => state.showToast) // Toast notification
  
  // Konuşmaları yükle - mount'ta bir kez
  const loadConversations = async () => {
    setLoading(true) // Loading başlat
    setError(null) // Hataları temizle
    
    try {
      const data = await conversationService.getConversations() // API çağrısı
      setConversations(data) // Store'a kaydet
    } catch (err: any) {
      setError(err.detail || 'Konuşmalar yüklenemedi')
      console.error('Konuşma yükleme hatası:', err)
    } finally {
      setLoading(false) // Loading bitir
    }
  }
  
  // Konuşma seç - ID'yi store'a kaydet
  const selectConversation = (id: number) => {
    // Seçilen conversation'ı bul - trace için title gerekli
    const conversation = conversations.find((c) => c.id === id)
    
    // Trace et - kullanıcı etkileşimi
    if (conversation) {
      traceConversationSwitch(id, conversation.title)
    }
    
    setActiveConversation(id) // Aktif conversation güncelle
  }
  
  // Konuşma başlığını güncelle
  const updateConversation = async (id: number, title: string) => {
    try {
      // Backend'e gönder - başlığı güncelle
      const updated = await conversationService.updateConversation(id, title) // API çağrısı
      
      // Store'da da güncelle - map ile
      const updatedList = conversations.map((c) => 
        c.id === id ? updated : c // Güncellenen conversation'ı değiştir
      )
      setConversations(updatedList) // Güncel listeyi set et
      
      // Başarılı - toast göster
      showToast('Konuşma başlığı güncellendi', 'success')
    } catch (err: any) {
      setError(err.detail || 'Konuşma başlığı güncellenemedi')
      console.error('Konuşma güncelleme hatası:', err)
    }
  }
  
  // Konuşma sil - backend'den sil ve listeden çıkar
  const deleteConversation = async (id: number) => {
    try {
      // Trace ile birlikte sil - silme işlemini trace et
      await traceConversationDelete(id, async () => {
        await conversationService.deleteConversation(id) // API çağrısı - sil
      })
      
      // Store'dan da sil - filter ile
      const updated = conversations.filter((c) => c.id !== id) // Silineni hariç tut
      setConversations(updated) // Güncel listeyi set et
      
      // Silinen conversation aktifse, aktif conversation'ı temizle
      if (activeConversationId === id) {
        setActiveConversation(null) // Artık aktif conversation yok
      }
      
      // Başarılı - toast göster
      showToast('Konuşma silindi', 'success')
    } catch (err: any) {
      setError(err.detail || 'Konuşma silinemedi')
      console.error('Konuşma silme hatası:', err)
    }
  }
  
  // Component mount olduğunda konuşmaları yükle - useEffect
  useEffect(() => {
    loadConversations() // İlk yüklemede konuşmaları getir
  }, []) // Boş dependency - sadece mount'ta
  
  // Hook'un döndürdüğü değerler ve fonksiyonlar
  return {
    conversations, // Konuşma listesi
    activeConversationId, // Aktif conversation ID
    isLoading, // Loading durumu
    selectConversation, // Konuşma seçme fonksiyonu
    updateConversation, // Konuşma başlığını güncelleme fonksiyonu
    deleteConversation, // Konuşma silme fonksiyonu
    loadConversations, // Yeniden yükleme fonksiyonu (refresh için)
  }
}

