// ModelSelector.tsx - Profesyonel AI model seçimi component'i
// Modern UI, multi-filter desteği, akıllı arama

import { useState, useMemo, useRef, useEffect } from 'react'
import type { Model } from '@/types'

interface ModelSelectorProps {
  models: Model[] // Mevcut model listesi
  selectedModel: string | null // Seçili model ID'si
  onSelect: (modelId: string) => void // Model seçildiğinde çağrılacak fonksiyon
  disabled?: boolean // Select disabled mı
}

// Filtre state
type FilterState = {
  showFreeOnly: boolean
  showVisionOnly: boolean
  sortBy: 'name' | 'price-asc' | 'price-desc'
  search: string
}

export function ModelSelector({ 
  models, 
  selectedModel, 
  onSelect, 
  disabled = false 
}: ModelSelectorProps) {
  // State
  const [isOpen, setIsOpen] = useState(false) // Dropdown açık mı
  const [filters, setFilters] = useState<FilterState>({
    showFreeOnly: false,
    showVisionOnly: false,
    sortBy: 'name',
    search: ''
  })
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Seçili model bilgisi
  const selectedModelData = useMemo(() => 
    models.find(m => m.id === selectedModel),
    [models, selectedModel]
  )
  
  // Filtrelenmiş ve sıralanmış modeller
  const filteredModels = useMemo(() => {
    let result = [...models]
    
    // Free filtresi
    if (filters.showFreeOnly) {
      result = result.filter(m => m.is_free)
    }
    
    // Vision filtresi
    if (filters.showVisionOnly) {
      result = result.filter(m => m.supportsVision)
    }
    
    // Arama filtresi
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.id.toLowerCase().includes(searchLower)
      )
    }
    
    // Sıralama
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (filters.sortBy === 'price-asc') {
      result.sort((a, b) => {
        const priceA = a.is_free ? 0 : (a.pricing?.average ?? Infinity)
        const priceB = b.is_free ? 0 : (b.pricing?.average ?? Infinity)
        return priceA - priceB
      })
    } else if (filters.sortBy === 'price-desc') {
      result.sort((a, b) => {
        const priceA = a.is_free ? 0 : (a.pricing?.average ?? 0)
        const priceB = b.is_free ? 0 : (b.pricing?.average ?? 0)
        return priceB - priceA
      })
    }
    
    return result
  }, [models, filters])
  
  // Fiyat formatla - 1K token bazında (en okunabilir)
  const formatPrice = (model: Model): string => {
    if (model.is_free) return ''
    if (!model.pricing?.average) return ''
    // 1M token fiyatını 1K'ya çevir (1000'e böl)
    const priceFor1K = (model.pricing.average / 1000)
    // Cent cinsinden göster (daha okunabilir)
    const cents = priceFor1K * 100
    if (cents < 0.01) {
      return `<0.01¢/1K`
    }
    if (cents < 1) {
      return `${cents.toFixed(2)}¢/1K`
    }
    return `${cents.toFixed(1)}¢/1K`
  }
  
  // Model seç handler
  const handleSelect = (modelId: string) => {
    onSelect(modelId)
    setIsOpen(false)
  }
  
  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Selected Model Display - Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-xl
                   text-left transition-all duration-200
                   ${isOpen 
                     ? 'border-blue-500 ring-4 ring-blue-500/20' 
                     : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                   }
                   ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                   shadow-sm hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedModelData ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedModelData.name}
                  </span>
                  {selectedModelData.supportsVision && <span className="text-sm">📸</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {selectedModelData.is_free ? (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                      Free
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                      {formatPrice(selectedModelData)}
                    </span>
                  )}
                  {selectedModelData.context_length && (
                    <span>{selectedModelData.context_length.toLocaleString()} tokens</span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                Select a model ({models.length} available)
              </span>
            )}
          </div>
          
          {/* Dropdown icon */}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 
                       rounded-xl shadow-2xl overflow-hidden animate-slide-in">
          
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search models..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
          
          {/* Filters */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-wrap gap-2">
              {/* Free Filter */}
              <button
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  showFreeOnly: !prev.showFreeOnly,
                  // Free seçiliyken price sortingi kaldır
                  sortBy: !prev.showFreeOnly ? 'name' : prev.sortBy
                }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                           ${filters.showFreeOnly 
                             ? 'bg-green-500 text-white shadow-sm' 
                             : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-500'
                           }`}
              >
                🆓 Free Only
              </button>
              
              {/* Vision Filter */}
              <button
                onClick={() => setFilters(prev => ({ ...prev, showVisionOnly: !prev.showVisionOnly }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                           ${filters.showVisionOnly 
                             ? 'bg-purple-500 text-white shadow-sm' 
                             : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500'
                           }`}
              >
                📸 Vision
              </button>
              
              {/* Sort Dropdown */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                disabled={filters.showFreeOnly}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 
                         text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 
                         transition-colors
                         ${filters.showFreeOnly 
                           ? 'opacity-50 cursor-not-allowed' 
                           : 'hover:border-blue-500 cursor-pointer'
                         }`}
              >
                <option value="name">📝 By Name</option>
                <option value="price-asc">💲 Price: Low → High</option>
                <option value="price-desc">💰 Price: High → Low</option>
              </select>
              
              {/* Result count */}
              <div className="ml-auto px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                {filteredModels.length} models
              </div>
            </div>
          </div>
          
          {/* Model List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`w-full px-4 py-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50
                             border-l-4 ${model.id === selectedModel 
                               ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                               : 'border-l-transparent'
                             }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                          {model.name}
                        </span>
                        {model.supportsVision && <span className="text-xs">📸</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {model.id}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {model.is_free ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 
                                       rounded-md text-xs font-medium">
                          Free
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                       rounded-md text-xs font-medium">
                          {formatPrice(model)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No models found matching your filters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
