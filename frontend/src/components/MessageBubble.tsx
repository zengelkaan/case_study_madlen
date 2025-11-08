// MessageBubble.tsx - Modern message bubble
// Sleek design, better markdown, smooth animations

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message // Mesaj objesi - model_name içinde mevcut
  onEdit?: (messageId: number, newContent: string) => Promise<void> // Edit callback (opsiyonel)
}

export function MessageBubble({ message, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)  // Edit mode
  const [editedContent, setEditedContent] = useState(message.content)  // Düzenlenen içerik
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy error:', err)
    }
  }
  
  const handleEditStart = () => {
    setIsEditing(true)
    setEditedContent(message.content)
  }
  
  const handleEditCancel = () => {
    setIsEditing(false)
    setEditedContent(message.content)
  }
  
  const handleEditSave = async () => {
    if (!editedContent.trim() || !onEdit) return
    
    try {
      await onEdit(message.id, editedContent.trim())
      setIsEditing(false)
    } catch (err) {
      console.error('Edit error:', err)
      // Hata durumunda eski içeriğe geri dön
      setEditedContent(message.content)
      setIsEditing(false)
    }
  }
  
  // Timestamp formatting
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group animate-fade-in px-4`}>
      <div className="flex items-start gap-3 max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
        
        {/* Avatar - AI (left side) */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-0.5">
              <path d="M100 20C91.7157 20 85 26.7157 85 35V45C85 53.2843 91.7157 60 100 60C108.284 60 115 53.2843 115 45V35C115 26.7157 108.284 20 100 20Z" fill="#D97706"/>
              <path d="M70 50C61.7157 50 55 56.7157 55 65V75C55 83.2843 61.7157 90 70 90C78.2843 90 85 83.2843 85 75V65C85 56.7157 78.2843 50 70 50Z" fill="#D97706"/>
              <path d="M130 50C121.716 50 115 56.7157 115 65V75C115 83.2843 121.716 90 130 90C138.284 90 145 83.2843 145 75V65C145 56.7157 138.284 50 130 50Z" fill="#D97706"/>
              <path d="M40 90C40 81.7157 46.7157 75 55 75H145C153.284 75 160 81.7157 160 90V160C160 168.284 153.284 175 145 175H55C46.7157 175 40 168.284 40 160V90Z" fill="#D97706"/>
              <rect x="65" y="110" width="25" height="35" rx="5" fill="white"/>
              <rect x="110" y="110" width="25" height="35" rx="5" fill="white"/>
              <path d="M75 125C75 122.239 77.2386 120 80 120C82.7614 120 85 122.239 85 125V130C85 132.761 82.7614 135 80 135C77.2386 135 75 132.761 75 130V125Z" fill="#D97706"/>
              <path d="M115 125C115 122.239 117.239 120 120 120C122.761 120 125 122.239 125 125V130C125 132.761 122.761 135 120 135C117.239 135 115 132.761 115 130V125Z" fill="#D97706"/>
            </svg>
          </div>
        )}
        
        {/* Message Content */}
        <div className={`flex-1 min-w-0 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${
          isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
        }`}>
          
          {/* Image */}
          {message.image_url && (
            <div className={`${isUser ? 'p-2' : 'p-3 border-b border-gray-200 dark:border-gray-700'}`}>
              <div 
                onClick={() => setImageExpanded(!imageExpanded)}
                className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200
                           ${imageExpanded ? 'max-w-full' : 'max-w-xs'} group/image`}
              >
                <img
                  src={message.image_url}
                  alt="Attached"
                  className="w-full h-auto transition-transform duration-200 group-hover/image:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors 
                              flex items-center justify-center">
                  <div className="opacity-0 group-hover/image:opacity-100 transition-opacity 
                                bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs">
                    {imageExpanded ? 'Click to minimize' : 'Click to expand'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Text Content */}
          <div className={`${message.image_url ? 'p-4' : 'px-4 py-3'}`}>
            {isUser ? (
              isEditing ? (
                // Edit mode - textarea
                <div className="space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-blue-700/50 text-white rounded-lg px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-blue-300
                             placeholder-blue-200 resize-none min-h-[60px]"
                    placeholder="Mesajınızı düzenleyin..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleEditSave()
                      } else if (e.key === 'Escape') {
                        handleEditCancel()
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={!editedContent.trim()}
                      className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium
                               hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                    >
                      ✓ Kaydet ve Gönder
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1.5 bg-blue-700/50 text-white rounded-lg text-sm
                               hover:bg-blue-700/70 transition-colors"
                    >
                      ✕ İptal
                    </button>
                  </div>
                </div>
              ) : (
                // Normal mode - simple text
              <p className="text-white whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
              )
            ) : (
              // AI message - markdown rendering
              <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:mt-3 prose-headings:mb-2
                            prose-p:my-2 prose-p:leading-relaxed
                            prose-pre:my-2 prose-pre:!bg-gray-900 dark:prose-pre:!bg-black
                            prose-code:text-pink-600 dark:prose-code:text-pink-400
                            prose-a:text-blue-600 dark:prose-a:text-blue-400
                            prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      
                      return !isInline ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match![1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: '#1a1a1a',
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className}>
                          {children}
                        </code>
                      )
                    },
                    a: ({node, ...props}) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Footer: Time + Model + Actions */}
          <div className={`px-4 py-2 flex items-center justify-between gap-3 border-t transition-colors ${
            isUser 
              ? 'border-blue-500/30' 
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Timestamp */}
              <span className={`text-xs flex-shrink-0 ${
                isUser 
                  ? 'text-blue-100' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
              </span>
              
              {/* Model Name - sadece AI mesajlarında ve model_name varsa */}
              {!isUser && message.model_name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span className="truncate font-medium">
                    Answered by: <span className="text-blue-600 dark:text-blue-400">{message.model_name}</span>
                  </span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Edit Button - Sadece user mesajlarında ve edit mode değilken */}
              {isUser && !isEditing && onEdit && (
                <button
                  onClick={handleEditStart}
                  className="group/edit flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                           hover:bg-blue-700 text-blue-100 transition-all duration-200"
                  title="Edit message"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden group-hover/edit:inline">Edit</span>
                </button>
              )}
            
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`group/copy flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                         transition-all duration-200 ${
                copied 
                  ? (isUser 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300')
                  : (isUser 
                      ? 'hover:bg-blue-700 text-blue-100' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400')
              }`}
              title="Copy message"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="group-hover/copy:inline hidden">Copy</span>
                </>
              )}
            </button>
            </div>
          </div>
        </div>
        
        {/* Avatar - User (right side) */}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                        bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md text-sm font-medium">
            👤
          </div>
        )}
      </div>
    </div>
  )
}
