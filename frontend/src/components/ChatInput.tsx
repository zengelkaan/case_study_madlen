// ChatInput.tsx - Modern message input
// Auto-resize, file upload, smooth animations

import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string) => void
  disabled?: boolean
  supportsVision?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSend, 
  disabled = false, 
  supportsVision = false,
  placeholder = 'Type your message...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [message])
  
  const handleSend = () => {
    if (message.trim() || imageBase64) {
      onSend(message.trim(), imageBase64 || undefined)
      setMessage('')
      setImagePreview(null)
      setImageBase64(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Read and convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }
  
  const removeImage = () => {
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
      <div className="px-6 py-4">
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block animate-fade-in">
            <div className="relative group">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white 
                         rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Input Container */}
        <div 
          onClick={() => textareaRef.current?.focus()}
          className={`relative rounded-2xl transition-all duration-200 cursor-text ${
          isFocused 
            ? 'ring-2 ring-blue-500 shadow-lg' 
            : 'ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm hover:shadow-md'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-3">
            
            {/* Attach Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={disabled || !supportsVision}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200
                         ${supportsVision 
                           ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                           : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                         } ${imagePreview ? 'ring-2 ring-blue-500' : ''}`}
              title={supportsVision ? 'Attach image' : 'Current model doesn\'t support images'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent border-none resize-none outline-none
                       text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       text-sm leading-relaxed max-h-[200px] scrollbar-thin py-2"
            />
            
            {/* Send Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSend()
              }}
              disabled={disabled || (!message.trim() && !imageBase64)}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 transform
                         ${(message.trim() || imageBase64) && !disabled
                           ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 hover:scale-105 active:scale-95' 
                           : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                         }`}
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Helper Text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">
                Enter
              </kbd> to send
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">
                Shift+Enter
              </kbd> for new line
            </span>
          </div>
          
          {supportsVision && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <span>📸</span>
              <span>Images supported</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
