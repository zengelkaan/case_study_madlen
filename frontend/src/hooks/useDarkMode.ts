// hooks/useDarkMode.ts - Dark mode yönetimi
// localStorage ile persist eder, system tercihini de destekler

import { useEffect, useState } from 'react'

// Dark mode custom hook
export function useDarkMode() {
  // State - dark mode aktif mi (localStorage'dan oku veya system tercihini kullan)
  const [isDark, setIsDark] = useState<boolean>(() => {
    // localStorage'da kayıtlı değer var mı kontrol et
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true' // localStorage'dan oku
    }
    
    // localStorage'da yoksa - system tercihini kullan
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  // Dark mode değiştiğinde - html tag'ine class ekle/çıkar
  useEffect(() => {
    const root = window.document.documentElement // html tag'i
    
    if (isDark) {
      root.classList.add('dark') // Dark mode aktif - html'e dark class ekle
    } else {
      root.classList.remove('dark') // Light mode aktif - dark class'ı kaldır
    }
    
    // localStorage'a kaydet - browser kapatılsa bile hatırlanır
    localStorage.setItem('darkMode', String(isDark))
  }, [isDark]) // Dependency - isDark değişince çalışır
  
  // Toggle fonksiyonu - dark/light geçişi
  const toggleDarkMode = () => {
    setIsDark((prev) => !prev) // State'i toggle et
  }
  
  // Hook'un döndürdüğü değerler
  return {
    isDark, // Dark mode aktif mi
    toggleDarkMode, // Toggle fonksiyonu
  }
}

