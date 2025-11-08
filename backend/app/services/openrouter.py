# openrouter.py - OpenRouter API client servisi
# OpenRouter API ile iletişim kuran servis sınıfı

import httpx  # Async HTTP client - OpenRouter API çağrıları için
from typing import List, Dict, Any, Optional, AsyncGenerator  # Type hints
from opentelemetry import trace  # OpenTelemetry tracing - custom span'ler için
from app.config import settings  # Ayarlardan API key alacağız

# Tracer oluştur - bu servis için custom span'ler oluşturmak üzere
tracer = trace.get_tracer(__name__)


class OpenRouterService:
    """
    OpenRouter API ile iletişim servisi
    AI modelleri listesi ve chat completion işlemlerini yönetir
    """
    
    def __init__(self):
        """
        Servis başlatıcı - API ayarlarını yükle
        """
        self.api_key = settings.OPENROUTER_API_KEY  # .env'den API key al
        self.base_url = settings.OPENROUTER_BASE_URL  # Base URL (https://openrouter.ai/api/v1)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",  # Bearer token ile yetkilendirme
            "Content-Type": "application/json",  # JSON formatında veri gönderiyoruz
        }  # Her request'te kullanılacak header'lar
    
    async def get_models(self, free_only: bool = True) -> List[Dict[str, Any]]:
        """
        OpenRouter'dan AI modellerini listele
        
        Args:
            free_only: True ise sadece ücretsiz modeller, False ise tüm modeller
        
        Returns:
            List[Dict]: Model listesi - her model bir dictionary
        """
        # Custom span oluştur - bu işlemi trace et
        with tracer.start_as_current_span("openrouter.get_models") as span:
            # Span'e attribute ekle - debug için yararlı
            span.set_attribute("openrouter.endpoint", "/models")  # Hangi endpoint çağrıldı
            span.set_attribute("openrouter.free_only", free_only)  # Sadece ücretsiz mi?
            
            async with httpx.AsyncClient() as client:  # Async HTTP client aç
                try:
                    # OpenRouter models endpoint'ine GET request
                    response = await client.get(
                        f"{self.base_url}/models",  # https://openrouter.ai/api/v1/models
                        headers=self.headers,  # Authorization header ile
                        timeout=10.0  # 10 saniye timeout
                    )
                    response.raise_for_status()  # 4xx veya 5xx hatalarında exception fırlat
                    
                    # Response'u JSON'a çevir
                    data = response.json()
                    all_models = data.get("data", [])  # "data" anahtarındaki model listesi
                    
                    # Modelleri işle - fiyat bilgilerini ekle
                    processed_models = []
                    for model in all_models:
                        # Fiyat bilgilerini al (string olarak gelir, float'a çevir)
                        pricing = model.get("pricing", {})  # Pricing objesi
                        prompt_price = float(pricing.get("prompt", "0"))  # Prompt başına ücret ($)
                        completion_price = float(pricing.get("completion", "0"))  # Completion başına ücret ($)
                        
                        # Ücretsiz model kontrolü
                        is_free = (prompt_price == 0 and completion_price == 0)  # Her ikisi de 0 ise ücretsiz
                        
                        # Eğer sadece ücretsiz modeller istenmişse ve model ücretliyse, atla
                        if free_only and not is_free:
                            continue  # Bu modeli listeye ekleme
                        
                        # Ortalama maliyet hesapla (prompt + completion ortalaması, 1M token için)
                        avg_cost = (prompt_price + completion_price) / 2 if not is_free else 0  # $/1M token
                        
                        # Vision desteği kontrolü (description veya id'de "vision" geçiyor mu?)
                        description = model.get("description", "").lower()  # Açıklama (küçük harf)
                        model_id = model.get("id", "").lower()  # Model ID (küçük harf)
                        model_name = model.get("name", "").lower()  # Model adı (küçük harf)
                        
                        # Vision keyword'lerini ara
                        supports_vision = any(
                            keyword in description or keyword in model_id or keyword in model_name
                            for keyword in ["vision", "image", "visual", "multimodal", "gpt-4o", "gpt-4-turbo", "claude-3"]
                        )  # Vision desteği var mı?
                        
                        # Model bilgilerini ekle
                        processed_models.append({
                            "id": model.get("id"),  # Model ID - örn: "mistralai/mistral-7b-instruct"
                            "name": model.get("name", model.get("id")),  # Model adı - yoksa ID kullan
                            "description": model.get("description", ""),  # Model açıklaması
                            "context_length": model.get("context_length", 4096),  # Max token sayısı
                            "pricing": {
                                "prompt": prompt_price,  # Prompt başına ücret ($/1M token)
                                "completion": completion_price,  # Completion başına ücret ($/1M token)
                                "average": avg_cost,  # Ortalama maliyet ($/1M token)
                            },  # Fiyat bilgileri
                            "is_free": is_free,  # Ücretsiz mi?
                            "supportsVision": supports_vision,  # Vision desteği var mı?
                        })
                    
                    # Span'e sonuç bilgisi ekle
                    span.set_attribute("openrouter.models_count", len(processed_models))  # Kaç model döndü
                    span.set_attribute("openrouter.status", "success")  # İşlem başarılı
                    
                    return processed_models  # Model listesini döndür
                    
                except httpx.HTTPError as e:  # HTTP hataları (network, timeout, vb.)
                    # Span'e hata bilgisi ekle
                    span.set_attribute("openrouter.status", "error")  # İşlem hatalı
                    span.set_attribute("error.message", str(e))  # Hata mesajı
                    span.record_exception(e)  # Exception'ı trace'e kaydet
                    
                    print(f"❌ OpenRouter API Hatası: {e}")  # Hata mesajını logla
                    return []  # Boş liste döndür - frontend'e hata gösterme yerine
    
    async def chat_completion(
        self,
        model: str,  # Kullanılacak model ID - örn: "mistralai/mistral-7b-instruct"
        messages: List[Dict[str, str]],  # Sohbet geçmişi - [{"role": "user", "content": "..."}]
        stream: bool = False  # Streaming mode - True ise cevabı parça parça al
    ) -> Dict[str, Any]:
        """
        OpenRouter'a chat completion isteği gönder
        Model'den cevap al (streaming veya normal)
        
        Args:
            model: Kullanılacak AI model ID
            messages: Sohbet mesajları - format: [{"role": "user/assistant", "content": "..."}]
            stream: Streaming mode aktif mi?
            
        Returns:
            Dict: Model'in cevabı veya hata mesajı
        """
        # Custom span oluştur - AI completion işlemini trace et
        with tracer.start_as_current_span("openrouter.chat_completion") as span:
            # Span'e attribute ekle - AI işlemi detayları
            span.set_attribute("openrouter.model", model)  # Hangi model kullanıldı
            span.set_attribute("openrouter.message_count", len(messages))  # Kaç mesaj gönderildi
            span.set_attribute("openrouter.stream", stream)  # Streaming mode var mı
            
            async with httpx.AsyncClient() as client:  # Async HTTP client aç
                try:
                    # Request payload oluştur
                    payload = {
                        "model": model,  # Hangi model kullanılacak
                        "messages": messages,  # Sohbet geçmişi
                        "stream": stream,  # Streaming aktif mi?
                    }
                    
                    # OpenRouter chat completion endpoint'ine POST request
                    response = await client.post(
                        f"{self.base_url}/chat/completions",  # https://openrouter.ai/api/v1/chat/completions
                        headers=self.headers,  # Authorization header
                        json=payload,  # Request body - JSON formatında
                        timeout=60.0  # 60 saniye timeout (AI cevabı için daha uzun)
                    )
                    response.raise_for_status()  # Hata varsa exception fırlat
                    
                    # Response'u JSON'a çevir
                    result = response.json()
                    
                    # Span'e başarı bilgisi ekle
                    span.set_attribute("openrouter.status", "success")  # İşlem başarılı
                    # AI cevabının uzunluğu
                    if "choices" in result and len(result["choices"]) > 0:
                        content = result["choices"][0].get("message", {}).get("content", "")
                        span.set_attribute("openrouter.response_length", len(content))  # Cevap uzunluğu
                    
                    return result  # Sonucu döndür
                    
                except httpx.HTTPStatusError as e:  # HTTP status hataları (404, 429, 500 vb.)
                    # Span'e hata bilgisi ekle
                    span.set_attribute("openrouter.status", "error")  # İşlem hatalı
                    span.set_attribute("error.message", str(e))  # Hata mesajı
                    span.set_attribute("error.status_code", e.response.status_code)  # HTTP status code
                    span.record_exception(e)  # Exception'ı trace'e kaydet
                    
                    # Kullanıcı dostu hata mesajı oluştur - status code'a göre
                    status_code = e.response.status_code
                    
                    if status_code == 429:
                        user_message = "Çok fazla istek gönderildi. Lütfen 1-2 dakika bekleyip tekrar deneyin."
                    elif status_code == 404:
                        user_message = "Model bulunamadı. Lütfen farklı bir model seçin."
                    elif status_code == 401:
                        user_message = "API anahtarı geçersiz. Lütfen backend .env dosyasını kontrol edin."
                    elif status_code == 503:
                        user_message = "AI servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin."
                    else:
                        user_message = f"Bir hata oluştu (Kod: {status_code}). Lütfen tekrar deneyin."
                    
                    print(f"❌ Chat Completion Hatası ({status_code}): {e}")  # Detaylı hata logla
                    
                    # Hata durumunda user-friendly mesaj döndür
                    return {
                        "error": True,  # Hata bayrağı
                        "message": user_message,  # Kullanıcı dostu mesaj
                        "status_code": status_code  # Status code
                    }
                    
                except httpx.HTTPError as e:  # Diğer HTTP hataları (timeout, connection vb.)
                    # Span'e hata bilgisi ekle
                    span.set_attribute("openrouter.status", "error")
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    
                    print(f"❌ Chat Completion Hatası: {e}")  # Hata logla
                    
                    # Hata durumunda user-friendly mesaj döndür
                    return {
                        "error": True,  # Hata bayrağı
                        "message": "Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.",
                        "details": str(e)
                    }
    
    async def chat_completion_stream(
        self,
        model: str,  # Kullanılacak model ID
        messages: List[Dict[str, str]]  # Sohbet geçmişi
    ) -> AsyncGenerator[str, None]:
        """
        OpenRouter'dan streaming chat completion
        Model'in cevabını parça parça (token token) al
        
        Args:
            model: Kullanılacak AI model ID
            messages: Sohbet mesajları
            
        Yields:
            str: Model'in cevabının parçaları (token'lar)
        """
        async with httpx.AsyncClient() as client:  # Async HTTP client aç
            try:
                # Request payload - stream=True ile
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": True,  # Streaming mode aktif
                }
                
                # Streaming request - response'u parça parça oku
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                    timeout=60.0
                ) as response:
                    response.raise_for_status()  # Hata kontrolü
                    
                    # Response'u satır satır oku (Server-Sent Events formatında gelir)
                    async for line in response.aiter_lines():
                        if line.strip():  # Boş satırları atla
                            # "data: " prefix'ini kaldır
                            if line.startswith("data: "):
                                data = line[6:]  # "data: " kısmını kes
                                
                                # Stream sonu kontrolü
                                if data == "[DONE]":  # OpenRouter stream bitişi
                                    break  # Döngüden çık
                                
                                # JSON parse et ve content'i yield et
                                try:
                                    import json  # JSON parse için
                                    chunk = json.loads(data)  # JSON'a çevir
                                    # Delta içindeki content'i al
                                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if content:  # Content varsa
                                        yield content  # Token'ı gönder
                                except json.JSONDecodeError:  # JSON parse hatası
                                    continue  # Bu satırı atla, devam et
                                    
            except httpx.HTTPStatusError as e:  # HTTP status hataları (404, 429, 500 vb.)
                # Kullanıcı dostu hata mesajı oluştur - status code'a göre
                status_code = e.response.status_code  # HTTP status code
                
                if status_code == 429:
                    error_msg = "⏳ Çok fazla istek gönderildi.\n\nLütfen 1-2 dakika bekleyip tekrar deneyin.\n\nÜcretsiz API kullanımında istek limiti vardır."
                elif status_code == 404:
                    error_msg = "❌ Model bulunamadı veya artık kullanılmıyor.\n\nLütfen model dropdown'ından farklı bir model seçin."
                elif status_code == 401:
                    error_msg = "🔑 API anahtarı geçersiz.\n\nLütfen backend/.env dosyasındaki OPENROUTER_API_KEY'i kontrol edin."
                elif status_code == 503:
                    error_msg = "🔧 AI servisi şu an kullanılamıyor.\n\nLütfen birkaç dakika sonra tekrar deneyin."
                else:
                    error_msg = f"❌ Beklenmeyen bir hata oluştu (HTTP {status_code}).\n\nLütfen tekrar deneyin veya farklı bir model seçin."
                
                print(f"❌ Streaming Hatası ({status_code}): {e}")  # Detaylı hata logla (backend console)
                yield error_msg  # Kullanıcı dostu hata mesajı - AI mesajı olarak gösterilecek
                
            except httpx.HTTPError as e:  # Diğer HTTP hataları (timeout, connection vb.)
                print(f"❌ Streaming Hatası: {e}")  # Detaylı hata logla
                yield "❌ Bağlantı hatası oluştu.\n\nİnternet bağlantınızı kontrol edin ve tekrar deneyin."  # Kullanıcı dostu mesaj


# Singleton instance - uygulama boyunca tek bir instance kullanılır
openrouter_service = OpenRouterService()

