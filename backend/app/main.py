# main.py - FastAPI uygulaması ana dosyası
# Tüm uygulama buradan başlar

from fastapi import FastAPI  # FastAPI framework
from fastapi.middleware.cors import CORSMiddleware  # CORS middleware - frontend ile iletişim için
from contextlib import asynccontextmanager  # Async context manager - startup/shutdown işlemleri için
from app.config import settings  # Uygulama ayarları
from app.database import init_db  # Database başlatma fonksiyonu


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Uygulama yaşam döngüsü yönetimi
    Startup: Uygulama başlarken çalışır
    Shutdown: Uygulama kapanırken çalışır
    """
    # Startup - Uygulama başlarken yapılacaklar
    print("🚀 Uygulama başlatılıyor")  # Konsola bilgi mesajı
    
    # OpenTelemetry'yi başlat - distributed tracing için
    from app.telemetry import setup_telemetry  # Telemetry setup fonksiyonu
    setup_telemetry()  # Tracer, Jaeger exporter ve instrumentation'ları kur
    
    await init_db()  # Veritabanı tablolarını oluştur
    print("✅ Veritabanı hazır")  # Başarı mesajı
    
    yield  # Uygulama çalışır (bu satır arasında)
    
    # Shutdown - Uygulama kapanırken yapılacaklar
    print("Uygulama kapatılıyor")  # Kapanış mesajı


# FastAPI uygulaması oluştur
app = FastAPI(
    title="Madlen AI Chat API",  # API başlığı - Swagger'da görünür
    description="OpenRouter üzerinden AI modelleriyle sohbet uygulaması",  # API açıklaması
    version="1.0.0",  # API versiyonu
    debug=settings.DEBUG,  # Debug modu
    lifespan=lifespan,  # Yaşam döngüsü yöneticisi
)

# FastAPI Instrumentation - tüm HTTP request/response'lar otomatik trace edilir
# Not: setup_telemetry() çağrıldıktan SONRA app'i instrument etmeliyiz
# Bu yüzden bu işlem startup'ta değil, app oluştuktan sonra yapılıyor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # FastAPI instrumentation
FastAPIInstrumentor.instrument_app(app)  # App'i instrument et - tüm endpoint'ler otomatik trace edilecek


# Global Error Handler'ları Kaydet - tüm exception'ları yakala
from app.error_handlers import register_error_handlers  # Error handler registration fonksiyonu
register_error_handlers(app)  # Exception handler'ları app'e ekle


# CORS Middleware Yapılandırması
# Frontend (React) ile backend (FastAPI) farklı portlarda çalıştığı için CORS gerekli
app.add_middleware(
    CORSMiddleware,  # CORS middleware ekle
    allow_origins=settings.get_origins_list(),  # İzin verilen origin'ler (.env'den)
    allow_credentials=True,  # Cookie ve authentication header'larına izin ver
    allow_methods=["*"],  # Tüm HTTP methodlarına izin ver (GET, POST, PUT, DELETE, vb.)
    allow_headers=["*"],  # Tüm header'lara izin ver
    expose_headers=["X-Conversation-Id"],  # Custom header'ları frontend'e expose et - browser okuyabilsin
)


# Router'ları ekle - API endpoint'leri
from app.routers import models_router, chat_router, conversations_router  # Router'ları import et

app.include_router(models_router)  # Models router'ı ekle - /api/models endpoint'leri
app.include_router(chat_router)  # Chat router'ı ekle - /api/chat endpoint'leri
app.include_router(conversations_router)  # Conversations router'ı ekle - /api/conversations endpoint'leri


# Root Endpoint - Temel sağlık kontrolü
@app.get("/")
async def root():
    """
    Ana endpoint - API'nin çalıştığını kontrol et
    """
    return {
        "message": "Madlen AI Chat API",  # Hoşgeldin mesajı
        "status": "running",  # Durum
        "version": "1.0.0",  # Versiyon
        "environment": settings.ENV,  # Ortam (development/production)
    }


# Health Check Endpoint - Detaylı sağlık kontrolü
@app.get("/api/health")
async def health_check():
    """
    Sağlık kontrolü endpoint'i
    Uygulamanın ve bağlantıların durumunu kontrol eder
    """
    return {
        "status": "healthy",  # Genel durum
        "service": settings.OTEL_SERVICE_NAME,  # Servis adı
        "environment": settings.ENV,  # Ortam
        "database": "connected",  # Database durumu (basitleştirilmiş)
        "openrouter": "configured" if settings.OPENROUTER_API_KEY else "not_configured",  # OpenRouter durumu
    }


# Uygulama başlatma bilgisi
if __name__ == "__main__":
    # Bu dosya direkt çalıştırılırsa (python main.py)
    import uvicorn  # ASGI server
    
    print(f"Sunucu başlatılıyor: {settings.HOST}:{settings.PORT}")  # Başlangıç mesajı
    
    # Uvicorn ile uygulamayı başlat
    uvicorn.run(
        "app.main:app",  # Uygulama path'i
        host=settings.HOST,  # Host (.env'den)
        port=settings.PORT,  # Port (.env'den)
        reload=settings.DEBUG,  # Debug modda otomatik reload
        log_level="info" if not settings.DEBUG else "debug",  # Log seviyesi
    )

