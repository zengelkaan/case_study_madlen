// Sidebar.tsx - Modern conversation sidebar
// Card-based design, smooth animations, professional look, drag & drop reordering

import { useState, useEffect } from 'react'
import type { Conversation } from '@/types'
import { EmptyState } from './EmptyState'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversationId: number | null
  onSelectConversation: (id: number) => void
  onNewConversation: () => void
  onUpdateConversation: (id: number, title: string) => void
  onDeleteConversation: (id: number) => void
  loading?: boolean
}

export function Sidebar({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation, 
  onNewConversation,
  onUpdateConversation,
  onDeleteConversation,
  loading = false 
}: SidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [localConversations, setLocalConversations] = useState(conversations)
  
  // Sync conversations prop with local state
  useEffect(() => {
    if (conversations.length === 0) {
      setLocalConversations([])
      return
    }
    
    // Load saved order from localStorage
    const savedOrder = localStorage.getItem('conversation-order')
    if (savedOrder) {
      try {
        const orderMap: Record<number, number> = JSON.parse(savedOrder)
        
        // Sort conversations by saved order
        const sorted = [...conversations].sort((a, b) => {
          const orderA = orderMap[a.id] ?? 9999
          const orderB = orderMap[b.id] ?? 9999
          return orderA - orderB
        })
        
        setLocalConversations(sorted)
        return
      } catch (err) {
        console.error('Error loading conversation order:', err)
      }
    }
    
    // No saved order or error - use default
    setLocalConversations(conversations)
  }, [conversations])
  
  // Save order to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (localConversations.length === 0) return
    
    // Create order map
    const orderMap: Record<number, number> = {}
    localConversations.forEach((conv, index) => {
      orderMap[conv.id] = index
    })
    
    // Save to localStorage
    try {
      localStorage.setItem('conversation-order', JSON.stringify(orderMap))
    } catch (err) {
      console.error('Error saving conversation order:', err)
    }
  }, [localConversations])
  
  // Filtreleme - local conversations kullan
  const filteredConversations = localConversations.filter((conversation) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase()
    return conversation.title.toLowerCase().includes(searchLower) || 
           conversation.model_name.toLowerCase().includes(searchLower)
  })
  
  const startEdit = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }
  
  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }
  
  const saveEdit = (id: number) => {
    if (editTitle.trim()) {
      onUpdateConversation(id, editTitle.trim())
      cancelEdit()
    }
  }
  
  // Tarih formatla
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
  
  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId !== id) {
      setDragOverId(id)
    }
  }
  
  const handleDragLeave = () => {
    setDragOverId(null)
  }
  
  const handleDrop = (e: React.DragEvent, dropId: number) => {
    e.preventDefault()
    
    if (!draggedId || draggedId === dropId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    
    // Reorder conversations
    const draggedIndex = localConversations.findIndex(c => c.id === draggedId)
    const dropIndex = localConversations.findIndex(c => c.id === dropId)
    
    const newConversations = [...localConversations]
    const [removed] = newConversations.splice(draggedIndex, 1)
    newConversations.splice(dropIndex, 0, removed)
    
    setLocalConversations(newConversations)
    setDraggedId(null)
    setDragOverId(null)
  }
  
  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }
  
  return (
    <div className="w-64 md:w-72 lg:w-80 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl 
                    border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col h-screen 
                    hidden sm:flex">
      
      {/* Header Section */}
      <div className="p-4 space-y-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        {/* New Chat Button */}
        <button
          onClick={onNewConversation}
          className="group w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 
                   hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium
                   transition-all duration-200 shadow-lg hover:shadow-xl
                   flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 rounded-xl
                     text-sm placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                     transition-all text-gray-900 dark:text-gray-100"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title={searchTerm ? "No results" : "No conversations"}
            description={searchTerm ? "Try a different search term" : "Start a new chat to begin"}
          />
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              draggable={!editingId}
              onDragStart={(e) => handleDragStart(e, conversation.id)}
              onDragOver={(e) => handleDragOver(e, conversation.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, conversation.id)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative rounded-xl transition-all duration-200 cursor-pointer
                        border border-gray-200 dark:border-gray-700
                        ${draggedId === conversation.id ? 'opacity-50 scale-95' : ''}
                        ${dragOverId === conversation.id ? 'ring-2 ring-blue-500 scale-105' : ''}
                        ${selectedConversationId === conversation.id
                          ? 'bg-white dark:bg-gray-800 shadow-lg ring-2 ring-blue-500/50 scale-[1.02] border-blue-200 dark:border-blue-700'
                          : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white hover:dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
            >
              {/* Edit Mode */}
              {editingId === conversation.id ? (
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(conversation.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 
                             rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(conversation.id)}
                      className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                               text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onSelectConversation(conversation.id)}
                  className="p-3 space-y-2"
                >
                  {/* Title & Actions */}
                  <div className="flex items-start gap-2">
                    {/* Drag Handle - sürüklemek için tut */}
                    <div 
                      className="flex-shrink-0 pt-0.5 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="Drag to reorder"
                      style={{ cursor: 'grab' }}
                      onMouseDown={(e) => { e.currentTarget.style.cursor = 'grabbing' }}
                      onMouseUp={(e) => { e.currentTarget.style.cursor = 'grab' }}
                    >
                      <svg className="w-4 h-4 hover:text-gray-600 dark:hover:text-gray-400 transition-colors" 
                           fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z"/>
                      </svg>
                    </div>
                    
                    {/* Title */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                        {conversation.title}
                      </h3>
                      
                      {/* Action Buttons */}
                      {(hoveredId === conversation.id || selectedConversationId === conversation.id) && (
                        <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(conversation)
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                                   text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this conversation?')) {
                              onDeleteConversation(conversation.id)
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                                   text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Meta Info - sadece tarih */}
                  <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex-shrink-0">{formatDate(conversation.created_at)}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer Stats */}
      {conversations.length > 0 && !loading && (
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredConversations.length} of {conversations.length} conversations
          </div>
        </div>
      )}
    </div>
  )
}
