# telemetry.py - OpenTelemetry yapılandırması
# Distributed tracing için OpenTelemetry kurulumu ve Jaeger entegrasyonu

from opentelemetry import trace  # Tracing API - span oluşturma için
from opentelemetry.sdk.trace import TracerProvider  # Tracer provider - merkezi trace yönetimi
from opentelemetry.sdk.trace.export import BatchSpanProcessor  # Span'leri batch halinde gönder
from opentelemetry.sdk.resources import Resource, SERVICE_NAME  # Servis metadata
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter  # Jaeger'a gRPC ile span gönder
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # FastAPI otomatik instrumentation
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor  # HTTPX otomatik instrumentation
# SQLAlchemy instrumentation - şimdilik kapalı (çok fazla span yaratıyor)
# from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from app.config import settings  # Yapılandırma ayarları


def setup_telemetry():
    """
    OpenTelemetry telemetry'yi başlat
    
    Bu fonksiyon:
    1. Tracer provider oluşturur (merkezi trace yönetimi)
    2. Jaeger exporter ekler (span'leri Jaeger'a gönderir)
    3. FastAPI, HTTPX, SQLAlchemy instrumentation yapar (otomatik tracing)
    
    Not: Uygulama başlarken bir kez çağrılmalı (main.py'de)
    """
    
    # 1. Resource oluştur - servis metadata'sı
    # Bu bilgiler Jaeger'da görünecek (service adı, version, environment)
    resource = Resource.create(
        {
            SERVICE_NAME: settings.OTEL_SERVICE_NAME,  # Servis adı - "madlen-chat-backend"
            "service.version": "1.0.0",  # Servis versiyonu
            "deployment.environment": settings.ENV,  # Ortam - development/production
        }
    )
    
    # 2. Tracer Provider oluştur - merkezi trace yönetici
    # Tüm span'ler bu provider üzerinden yönetilir
    tracer_provider = TracerProvider(resource=resource)
    
    # 3. OTLP Exporter oluştur - Jaeger'a span gönderme (gRPC)
    # gRPC için endpoint: config'den oku ve insecure=True (lokalde TLS yok)
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        insecure=True,
        timeout=10,
    )
    
    # 4. Batch Span Processor ekle - span'leri toplu gönder
    # Her span'i tek tek göndermek yerine batch halinde gönderir (performans için)
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)  # Provider'a processor ekle
    
    # 5. Global tracer provider'ı ayarla - uygulama genelinde kullanılsın
    trace.set_tracer_provider(tracer_provider)
    
    # 6. Otomatik instrumentation'ları ekle
    # Bu instrumentation'lar otomatik olarak span oluşturur
    
    # HTTPX instrumentation - tüm HTTP client çağrıları otomatik trace edilir
    # OpenRouter API çağrıları buradan trace edilecek
    HTTPXClientInstrumentor().instrument()
    
    # SQLAlchemy instrumentation - KAPATILDI (çok fazla span oluşturuyordu - 100+ span/request)
    # Gerekirse kritik query'ler için manuel span eklenebilir
    # SQLAlchemyInstrumentor().instrument()
    
    # Basit bir başlangıç span'i oluşturarak exporter'in çalıştığını doğrula
    tracer = trace.get_tracer("startup")
    with tracer.start_as_current_span("otel.startup.ping") as span:
        span.set_attribute("otel.endpoint", settings.OTEL_EXPORTER_OTLP_ENDPOINT)
        span.set_attribute("service.name", settings.OTEL_SERVICE_NAME)

    print("✅ OpenTelemetry başlatıldı - Jaeger'a bağlandı")  # Başarı mesajı


def get_tracer(name: str = __name__):
    """
    Tracer al - custom span'ler için
    
    Kullanım:
        tracer = get_tracer("my_service")
        with tracer.start_as_current_span("my_operation"):
            # işlemler
    
    Args:
        name: Tracer adı (genelde module adı)
        
    Returns:
        Tracer: OpenTelemetry tracer instance
    """
    return trace.get_tracer(name)  # Global tracer provider'dan tracer al

