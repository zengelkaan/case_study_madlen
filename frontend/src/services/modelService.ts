// services/modelService.ts - AI modelleri API çağrıları
// Backend'in /api/models endpoint'leri ile iletişim

import { api } from './api' // Axios instance
import type { Model } from '@/types'

// Model Service - AI model listeleme işlemleri
export const modelService = {
  // Ücretsiz modelleri listele - GET /api/models/free
  async getModels(): Promise<Model[]> {
    const response = await api.get<Model[]>('/api/models/free')
    return response.data // Ücretsiz model listesini döndür
  },

  // Tüm modelleri listele - GET /api/models/
  async getAllModels(): Promise<Model[]> {
    const response = await api.get<Model[]>('/api/models/')
    return response.data // Tüm model listesini döndür
  },
}

