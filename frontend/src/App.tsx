// App.tsx - Ana uygulama component'i
// State management ile tüm UI component'lerini birleştirir

import { 
  ChatLayout, 
  Sidebar, 
  ChatHeader, 
  MessageList, 
  ChatInput,
  ErrorAlert,
  Toast
} from '@/components'
import { useModels, useConversations, useChat, useDarkMode } from '@/hooks' // useDarkMode eklendi
import { useChatStore } from '@/store/chatStore'
import { traceNewConversation, traceModelSelect } from '@/telemetry' // Tracing utilities

// Ana uygulama component'i - state management entegre
function App() {
  // Custom hook'lar - state yönetimi
  const { isDark, toggleDarkMode } = useDarkMode() // Dark mode hook
  const { models, isLoading: modelsLoading } = useModels() // Modelleri yükle
  const { 
    conversations, 
    activeConversationId, 
    isLoading: conversationsLoading,
    selectConversation,
    updateConversation,
    deleteConversation,
    loadConversations 
  } = useConversations() // Konuşmaları yükle
  
  const { 
    messages, 
    selectedModel, 
    isSending, 
    isLoadingMessages,
    sendMessageStream, // Streaming mode - kelime kelime AI cevabı (sendMessage yerine streaming kullanıyoruz)
    editAndResendMessage // Mesaj düzenleme
  } = useChat() // Chat işlemleri
  
  // Store'dan direkt state al
  const error = useChatStore((state) => state.error) // Global error state
  const setError = useChatStore((state) => state.setError) // Error temizleme
  const toast = useChatStore((state) => state.toast) // Toast notification
  const showToast = useChatStore((state) => state.showToast) // Toast göster
  const hideToast = useChatStore((state) => state.hideToast) // Toast gizle
  const setSelectedModel = useChatStore((state) => state.setSelectedModel) // Model seçimi
  const setActiveConversation = useChatStore((state) => state.setActiveConversation) // Aktif conversation
  const isTemporaryMode = useChatStore((state) => state.isTemporaryMode) // Geçici sohbet modu
  const toggleTemporaryMode = useChatStore((state) => state.toggleTemporaryMode) // Temporary mode toggle
  
  // Yeni sohbet başlat - aktif conversation'ı temizle
  const handleNewConversation = () => {
    traceNewConversation() // Trace et - kullanıcı yeni sohbet başlattı
    setActiveConversation(null) // Aktif conversation'ı kaldır
    // İlk mesaj gönderildiğinde yeni conversation oluşturulacak
  }
  
  // Model seçimi handler - tracing ile
  const handleModelSelect = (modelId: string) => {
    // Seçilen modeli bul - trace için model adı gerekli
    const model = models.find((m) => m.id === modelId)
    
    // Trace et - kullanıcı model seçti
    if (model) {
      traceModelSelect(modelId, model.name)
    }
    
    setSelectedModel(modelId) // Store'a kaydet
  }
  
  // Mesaj gönder handler - STREAMING MODE ile (kelime kelime AI cevabı), resim desteği
  const handleSendMessage = async (message: string, imageBase64?: string) => {
    // Yeni conversation için başlık oluştur - ilk 30 karakter (sadece yeni conversation için)
    const title = !activeConversationId && message.length > 30 ? message.substring(0, 30) + '...' : message
    
    try {
      // Streaming mode kullan - AI cevabı kelime kelime gelir, resim varsa gönder
      await sendMessageStream(message, activeConversationId ? undefined : title, imageBase64)
      
      // Konuşma listesini güncelle - AWAIT ile (yeni conversation eklenmiş veya güncellenmişse)
      await loadConversations()
      
      // Başarılı - toast gösterme (gürültüyü azalt)
      // showToast('Mesaj gönderildi!', 'success')
    } catch (err) {
      // Hata - toast göster
      showToast('Mesaj gönderilemedi', 'error')
    }
  }
  
  // Aktif conversation'ı bul - title için
  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  
  // Seçili modelin vision destekli olup olmadığını kontrol et
  const selectedModelData = models.find((m) => m.id === selectedModel)
  const supportsVision = selectedModelData?.supportsVision || false // Vision desteği var mı
  
  return (
    <>
      {/* Global error alert - üstte sabit */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-96">
          <ErrorAlert 
            message={error} // Hata mesajı
            onClose={() => setError(null)} // Kapat
          />
        </div>
      )}
      
      {/* Toast notification - sağ üstte */}
      {toast && (
        <Toast
          message={toast.message} // Toast mesajı
          type={toast.type} // Toast tipi (success/error/info)
          onClose={hideToast} // Kapat
          duration={3000} // 3 saniye sonra otomatik kapan
        />
      )}
      
      {/* Ana layout */}
      <ChatLayout
        // Sidebar - sol taraf (temporary mode'da gizle)
        sidebar={
          !isTemporaryMode ? ( // Temporary mode değilse sidebar göster
            <Sidebar
              conversations={conversations} // Konuşma listesi
              selectedConversationId={activeConversationId} // Seçili ID
              onSelectConversation={selectConversation} // Seçme handler
              onNewConversation={handleNewConversation} // Yeni sohbet
              onUpdateConversation={updateConversation} // Başlık güncelleme handler
              onDeleteConversation={deleteConversation} // Silme handler
              loading={conversationsLoading} // Loading state
            />
          ) : null // Temporary mode'da sidebar yok
        }
        
        // Header - üst bar
        header={
          <ChatHeader
            title={activeConversation?.title || 'Yeni Sohbet'} // Conversation başlığı
            models={models} // Model listesi
            selectedModel={selectedModel} // Seçili model
            onModelSelect={handleModelSelect} // Model seçme handler (tracing ile)
            disabled={modelsLoading || isSending} // Loading durumunda disabled
            isDark={isDark} // Dark mode aktif mi
            onToggleDarkMode={toggleDarkMode} // Dark mode toggle handler
            isTemporary={isTemporaryMode} // Temporary mode aktif mi
            onToggleTemporary={toggleTemporaryMode} // Temporary mode toggle handler
          />
        }
        
        // Messages - orta alan
        messages={
          <MessageList
            messages={messages} // Mesaj listesi
            loading={isLoadingMessages || isSending} // Loading state - mesaj yüklenirken veya gönderilirken
            modelName={selectedModelData?.name} // Seçili model adı - AI mesajlarında gösterilecek
            onEditMessage={editAndResendMessage} // Mesaj düzenleme handler
          />
        }
        
        // Input - alt bar
        input={
          <ChatInput
            onSend={handleSendMessage} // Mesaj gönderme handler
            disabled={isSending || !selectedModel} // AI cevap beklerken veya model seçilmemişse disabled
            supportsVision={supportsVision} // Seçili model vision destekli mi - resim upload için
            placeholder={
              !selectedModel 
                ? 'Önce bir model seçin...' // Model yoksa
                : supportsVision 
                  ? 'Mesajınızı yazın veya resim ekleyin (📸)...' // Vision model - resim eklenebilir
                  : 'Mesajınızı yazın...' // Normal placeholder
            }
          />
        }
      />
    </>
  )
}

// Component'i dışa aktar
export default App
