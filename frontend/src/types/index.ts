// types/index.ts - Tüm type'ları tek noktadan export et
// Bu sayede import'lar daha temiz olur: import { Model, Message } from '@/types'

// API type'larını export et
export type {
  Model,
  Message,
  Conversation,
  ChatRequest,
  ChatResponse,
  CreateConversationRequest,
  ApiError,
  PaginatedResponse,
} from './api.types'

