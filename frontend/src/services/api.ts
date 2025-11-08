// services/api.ts - Axios instance ve interceptor'lar
// Tüm HTTP request'leri bu instance üzerinden yapılır

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiError } from '@/types'

// Backend API base URL - environment variable'dan veya varsayılan
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Axios instance oluştur - tüm request'lerde kullanılacak
export const api = axios.create({
  baseURL: API_BASE_URL, // Backend URL'i
  timeout: 30000, // 30 saniye timeout - AI response uzun sürebilir
  headers: {
    'Content-Type': 'application/json', // JSON formatında veri gönder
  },
})

// Request Interceptor - Her request gönderilmeden önce çalışır
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Request gönderilmeden önce yapılacak işlemler

    // Konsola log - development ortamında debug için
    if (import.meta.env.DEV) {
      console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    }

    // Future: Authorization header eklenebilir
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config // Config'i değiştirerek gönder
  },
  (error: AxiosError) => {
    // Request oluşturulurken hata - nadiren olur
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response Interceptor - Her response geldiğinde çalışır
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Başarılı response - 2xx status code

    // Konsola log - development ortamında debug için
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.config.url, response.status)
    }

    return response // Response'u olduğu gibi döndür
  },
  (error: AxiosError<ApiError>) => {
    // Hatalı response - 4xx veya 5xx status code

    // Hata detaylarını al
    const status = error.response?.status
    const message = error.response?.data?.detail || error.message || 'Bilinmeyen hata'

    // Konsola detaylı hata log - debug için
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status,
      message,
    })

    // Özel hata mesajları - kullanıcı dostu
    let userFriendlyMessage = message

    if (status === 404) {
      userFriendlyMessage = 'İstenen kaynak bulunamadı'
    } else if (status === 400) {
      userFriendlyMessage = message // Backend'den gelen validation mesajı
    } else if (status === 429) {
      // Rate limiting hatası - çok fazla istek
      userFriendlyMessage = 'Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.'
    } else if (status === 500) {
      userFriendlyMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    } else if (status === 503) {
      // Service unavailable - OpenRouter API hatası
      userFriendlyMessage = message || 'AI servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
    } else if (!error.response) {
      userFriendlyMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.'
    }

    // Custom error object oluştur
    const apiError: ApiError = {
      detail: userFriendlyMessage,
      status,
    }

    // Future: 401 Unauthorized durumunda logout yapılabilir
    // if (status === 401) {
    //   localStorage.removeItem('token')
    //   window.location.href = '/login'
    // }

    return Promise.reject(apiError) // Hata fırlat - catch block'ta yakalanacak
  }
)

// Export edilmiş api instance - diğer dosyalarda kullanılacak
// Kullanım: import { api } from '@/services/api'
//          api.get('/conversations')

