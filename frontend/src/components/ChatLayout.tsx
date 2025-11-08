// ChatLayout.tsx - Ana layout component'i
// Sidebar, header, message list ve input'u bir araya getirir

import { ReactNode } from 'react'

interface ChatLayoutProps {
  sidebar: ReactNode // Sidebar component'i - sol taraf
  header: ReactNode // Header component'i - üst bar
  messages: ReactNode // Message list component'i - orta alan
  input: ReactNode // Chat input component'i - alt bar
}

// Chat layout component'i - flex layout ile 3 bölümlü tasarım
export function ChatLayout({ sidebar, header, messages, input }: ChatLayoutProps) {
  return (
    // Ana container - full screen, flex, dark mode desteği
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sol taraf - Sidebar */}
      {sidebar}
      
      {/* Sağ taraf - Chat alanı */}
      <div className="flex-1 flex flex-col">
        {/* Üst bar - Header - overflow visible (dropdown için) */}
        <div className="relative z-40">
        {header}
        </div>
        
        {/* Orta alan - Message list (scroll'lu container) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {messages}
        </div>
        
        {/* Alt bar - Input */}
        {input}
      </div>
    </div>
  )
}

