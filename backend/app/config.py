# config.py - Uygulama yapılandırma ayarları
# Bu dosya .env dosyasındaki environment variables'ları okur ve yönetir

from pydantic_settings import BaseSettings  # Pydantic'in settings sınıfı - environment variables için
from pydantic import Field  # Field ile default değerler ve validasyon tanımlarız
from typing import List  # Type hints için - liste tipi


class Settings(BaseSettings):
    """
    Uygulama ayarları sınıfı
    .env dosyasından otomatik olarak değerleri okur
    """
    
    # App Configuration - Uygulama temel ayarları
    ENV: str = Field(default="development")  # Ortam tipi: development, production, test
    DEBUG: bool = Field(default=False)  # Debug modu - geliştirme sırasında True
    HOST: str = Field(default="0.0.0.0")  # Sunucu host adresi - 0.0.0.0 tüm IP'lerden erişim sağlar
    PORT: int = Field(default=8000, ge=1024, le=65535)  # Sunucu portu - Geçerli port aralığı (1024-65535)
    ALLOWED_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000")  # CORS için izinli origin'ler - Vite otomatik port değiştirdiğinde de çalışır
    
    # OpenRouter API Configuration - AI modelleri için
    OPENROUTER_API_KEY: str = Field(default="")  # OpenRouter API anahtarı - zorunlu
    OPENROUTER_BASE_URL: str = Field(default="https://openrouter.ai/api/v1")  # OpenRouter API base URL
    
    # Database Configuration - Veritabanı ayarları
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./chat_app.db")  # Async SQLite connection string
    
    # OpenTelemetry Configuration - Observability ayarları
    OTEL_SERVICE_NAME: str = Field(default="madlen-chat-backend")  # Servis adı - Jaeger'da görünecek
    OTEL_TRACES_EXPORTER: str = Field(default="otlp")  # Trace export formatı
    OTEL_EXPORTER_OTLP_ENDPOINT: str = Field(default="http://localhost:4318/v1/traces")  # Jaeger collector endpoint (HTTP)
    OTEL_EXPORTER_OTLP_PROTOCOL: str = Field(default="http/protobuf")  # OTLP protokol tipi
    OTEL_METRICS_EXPORTER: str = Field(default="none")  # Metrics şimdilik kapalı
    OTEL_LOGS_EXPORTER: str = Field(default="none")  # Logs şimdilik kapalı
    OTEL_RESOURCE_ATTRIBUTES: str = Field(default="service.version=1.0.0,deployment.environment=dev")  # Servis metadata
    
    def get_origins_list(self) -> List[str]:
        """
        ALLOWED_ORIGINS string'ini liste formatına çevirir
        Örnek: "http://localhost:5173,http://localhost:3000" -> ["http://localhost:5173", "http://localhost:3000"]
        """
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]  # Virgülle ayır ve boşlukları temizle
    
    class Config:
        """
        Pydantic settings yapılandırması
        """
        env_file = ".env"  # .env dosyasından oku
        case_sensitive = True  # Büyük/küçük harf duyarlı (OPENROUTER_API_KEY != openrouter_api_key)


# Settings instance'ı oluştur - uygulama boyunca bu tek instance kullanılacak (singleton pattern)
settings = Settings()

