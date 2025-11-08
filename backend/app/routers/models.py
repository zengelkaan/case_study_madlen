# models.py - AI modelleri için API endpoint'leri
# OpenRouter'dan mevcut modelleri listeler

from fastapi import APIRouter  # FastAPI routing
from typing import List, Dict, Any  # Type hints
from app.services.openrouter import openrouter_service  # OpenRouter servisi
from app.exceptions import OpenRouterAPIException  # Custom exception


# Router oluştur - tüm model endpoint'leri /api/models prefix'i ile
router = APIRouter(
    prefix="/api/models",  # URL prefix - örn: /api/models/free
    tags=["models"]  # Swagger'da gruplandırma için tag
)


@router.get("/free", response_model=List[Dict[str, Any]])
async def get_free_models():
    """
    Ücretsiz AI modellerini listele
    
    OpenRouter'dan mevcut ücretsiz modelleri getirir.
    Frontend'de dropdown'da gösterilmek için kullanılır.
    
    Returns:
        List[Dict]: Ücretsiz model listesi
        Örnek:
        [
            {
                "id": "mistralai/mistral-7b-instruct",
                "name": "Mistral 7B Instruct",
                "description": "...",
                "context_length": 8192
            }
        ]
    """
    # OpenRouter servisinden modelleri al
    models = await openrouter_service.get_models()
    
    # Eğer boş liste dönerse (API hatası durumu)
    if not models:
        # Custom exception fırlat - 503 Service Unavailable
        raise OpenRouterAPIException("OpenRouter servisine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.")
    
    return models  # Model listesini döndür


@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_models():
    """
    TÜM AI modellerini listele (ücretsiz + ücretli)
    
    OpenRouter'dan tüm mevcut modelleri fiyat bilgileriyle getirir.
    Frontend'de dropdown'da filtrelenebilir ve sıralanabilir.
    
    Returns:
        List[Dict]: Tüm model listesi (fiyat bilgileriyle)
        Örnek:
        [
            {
                "id": "openai/gpt-4",
                "name": "GPT-4",
                "description": "...",
                "context_length": 8192,
                "pricing": {
                    "prompt": 0.03,
                    "completion": 0.06,
                    "average": 0.045
                },
                "is_free": false,
                "supportsVision": true
            }
        ]
    """
    # OpenRouter servisinden TÜM modelleri al (free_only=False)
    models = await openrouter_service.get_models(free_only=False)  # Tüm modeller
    
    # Eğer boş liste dönerse (API hatası durumu)
    if not models:
        # Custom exception fırlat - 503 Service Unavailable
        raise OpenRouterAPIException("OpenRouter servisine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.")
    
    return models  # Tüm model listesini döndür

