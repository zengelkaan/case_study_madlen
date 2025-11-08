// hooks/useModels.ts - Model listesi yönetimi custom hook'u
// Modelleri yükler ve store'a kaydeder

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { modelService } from '@/services'

// Model yükleme ve yönetimi hook'u
export function useModels() {
  // Store'dan state ve action'ları al
  const models = useChatStore((state) => state.models) // Model listesi
  const isLoading = useChatStore((state) => state.isLoadingModels) // Loading state
  const setModels = useChatStore((state) => state.setModels) // Set action
  const setLoading = useChatStore((state) => state.setLoadingModels) // Loading action
  const setError = useChatStore((state) => state.setError) // Error action
  
  // Component mount olduğunda modelleri yükle - useEffect
  useEffect(() => {
    // Modelleri backend'den çek
    const fetchModels = async () => {
      setLoading(true) // Loading başlat
      setError(null) // Önceki hataları temizle
      
      try {
        const data = await modelService.getAllModels() // TÜM modelleri çek (ücretsiz + ücretli)
        
        // Backend'den gelen modeller zaten supportsVision ile geliyor - tekrar tespit etmeye gerek yok
        setModels(data) // Store'a kaydet
      } catch (err: any) {
        // Hata durumunda error state'i güncelle
        setError(err.detail || 'Modeller yüklenemedi')
        console.error('Model yükleme hatası:', err)
      } finally {
        setLoading(false) // Loading bitir
      }
    }
    
    fetchModels() // Fonksiyonu çağır
  }, []) // Boş dependency array - sadece mount'ta çalışır
  
  // Hook'un döndürdüğü değerler
  return {
    models, // Model listesi
    isLoading, // Loading durumu
  }
}

