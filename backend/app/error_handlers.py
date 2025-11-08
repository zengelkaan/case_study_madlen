# error_handlers.py - Global error handler'lar
# Tüm exception'ları yakalayıp user-friendly response döner

from fastapi import Request, status  # FastAPI request ve status code'lar
from fastapi.responses import JSONResponse  # JSON response
from fastapi.exceptions import RequestValidationError  # Pydantic validation hatası
from opentelemetry import trace  # Tracing - hataları trace'e eklemek için
import traceback  # Exception traceback'i almak için


def register_error_handlers(app):
    """
    Global error handler'ları FastAPI app'e kaydet
    
    Bu fonksiyon main.py'de app oluşturulduktan sonra çağrılmalı
    
    Args:
        app: FastAPI app instance
    """
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
        Pydantic validation hatalarını yakala
        
        Kullanıcı geçersiz input gönderdiğinde (eksik field, yanlış tip, vb.)
        bu handler çalışır ve user-friendly hata mesajı döner
        
        Args:
            request: HTTP request
            exc: Validation exception
            
        Returns:
            JSONResponse: Formatlanmış hata mesajı
        """
        # Validation hatalarını topla - her field için ayrı hata mesajı
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(x) for x in error["loc"])  # Hata hangi field'de (örn: "body -> message")
            message = error["msg"]  # Hata mesajı
            error_type = error["type"]  # Hata tipi (örn: "value_error.missing")
            
            errors.append({
                "field": field,  # Hangi field'de hata var
                "message": message,  # Hata mesajı
                "type": error_type  # Hata tipi
            })
        
        # Trace'e hata ekle - debugging için
        span = trace.get_current_span()  # Aktif span'i al
        if span:
            span.set_attribute("error", True)  # Hata bayrağı
            span.set_attribute("error.type", "validation_error")  # Hata tipi
            span.set_attribute("error.fields", str([e["field"] for e in errors]))  # Hangi field'lerde hata
        
        # User-friendly error response döndür
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,  # 422 Unprocessable Entity
            content={
                "error": True,  # Hata bayrağı
                "error_code": "VALIDATION_ERROR",  # Error code
                "message": "Gönderilen veriler geçersiz",  # Genel mesaj
                "details": errors  # Detaylı hata listesi
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """
        Tüm diğer exception'ları yakala
        
        Beklenmeyen hatalar (500 Internal Server Error) için
        bu handler çalışır ve güvenli hata mesajı döner
        
        Args:
            request: HTTP request
            exc: Exception
            
        Returns:
            JSONResponse: Güvenli hata mesajı
        """
        # Exception detaylarını logla - production'da log sistemine gitmeli
        print(f"❌ Beklenmeyen Hata: {exc}")  # Hata mesajı
        print(f"📍 Endpoint: {request.method} {request.url.path}")  # Hangi endpoint'te hata oldu
        print(f"🔍 Traceback:")  # Traceback
        traceback.print_exc()  # Full traceback yazdır
        
        # Trace'e hata ekle - debugging için
        span = trace.get_current_span()  # Aktif span'i al
        if span:
            span.set_attribute("error", True)  # Hata bayrağı
            span.set_attribute("error.type", "internal_error")  # Hata tipi
            span.set_attribute("error.message", str(exc))  # Hata mesajı
            span.record_exception(exc)  # Exception'ı trace'e kaydet
        
        # Güvenli error response döndür
        # Not: Production'da detaylı hata mesajı gösterilmemeli (security risk)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,  # 500 Internal Server Error
            content={
                "error": True,  # Hata bayrağı
                "error_code": "INTERNAL_ERROR",  # Error code
                "message": "Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.",  # Güvenli mesaj
                # Development'ta detaylı hata göster, production'da gösterme
                "details": str(exc) if request.app.debug else None  # Debug modda detay göster
            }
        )

