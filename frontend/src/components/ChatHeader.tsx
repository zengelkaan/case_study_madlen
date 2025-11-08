// ChatHeader.tsx - Professional chat header
// Model selector, dark mode, temporary mode

import { ModelSelector } from './ModelSelector'
import type { Model } from '@/types'

interface ChatHeaderProps {
  title: string
  models: Model[]
  selectedModel: string | null
  onModelSelect: (modelId: string) => void
  disabled?: boolean
  isDark: boolean
  onToggleDarkMode: () => void
  isTemporary: boolean
  onToggleTemporary: () => void
}

export function ChatHeader({
  title,
  models,
  selectedModel,
  onModelSelect,
  disabled = false,
  isDark,
  onToggleDarkMode,
  isTemporary,
  onToggleTemporary
}: ChatHeaderProps) {
  return (
    <div className={`border-b transition-all duration-300
                    ${isTemporary
                      ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700'
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                    } backdrop-blur-xl`}>
      
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Title & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h1>
              
              {isTemporary && (
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 
                               text-xs font-medium rounded-full flex items-center gap-1.5 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Not Saved
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isTemporary 
                ? 'This conversation will not be saved' 
                : 'OpenRouter AI Chat'
              }
            </p>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            
            {/* Model Selector */}
            <div className="w-80">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelect={onModelSelect}
                disabled={disabled}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              
              {/* Temporary Mode Toggle */}
              <button
                onClick={onToggleTemporary}
                className={`p-2.5 rounded-xl transition-all duration-200
                           ${isTemporary
                             ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/50'
                             : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                           }`}
                title={isTemporary ? 'Switch to Normal Mode' : 'Switch to Temporary Mode'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
