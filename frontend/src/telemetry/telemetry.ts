// telemetry/telemetry.ts - OpenTelemetry yapılandırması (Frontend)
// Distributed tracing için OpenTelemetry kurulumu ve Jaeger entegrasyonu

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web' // Web tracer provider
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base' // Batch processor - performans için
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http' // Jaeger'a HTTP ile gönder
import { Resource } from '@opentelemetry/resources' // Servis metadata
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions' // Semantic conventions
// Auto instrumentation - conditional import to avoid build issues
// import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch' // Fetch API instrumentation
import { trace } from '@opentelemetry/api' // Tracing API

// OpenTelemetry'yi başlat
export function setupTelemetry() {
  // 1. Resource oluştur - servis metadata'sı (Jaeger'da görünecek)
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: 'madlen-chat-frontend', // Servis adı
    'service.version': '1.0.0', // Servis versiyonu
    'deployment.environment': 'development', // Ortam
  })
  
  // 2. Tracer Provider oluştur - merkezi trace yönetici
  const provider = new WebTracerProvider({
    resource: resource, // Yukarıda oluşturduğumuz resource
  })
  
  // 3. OTLP Exporter oluştur - Jaeger'a trace gönderme
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces', // Jaeger OTLP endpoint
  })
  
  // 4. Batch Span Processor ekle - span'leri toplu gönder (performans)
  provider.addSpanProcessor(new BatchSpanProcessor(exporter))
  
  // 5. Provider'ı global olarak kaydet - uygulama genelinde kullan
  provider.register()
  
  // 6. Fetch instrumentation - API çağrılarını trace et (manuel)
  // Not: registerInstrumentations yerine direkt instrumentation kullanıyoruz
  const fetchInstrumentation = new FetchInstrumentation({
        applyCustomAttributesOnSpan: (span, request) => {
      if (request instanceof Request) {
          span.setAttribute('http.url', request.url)
      }
        },
  })
  fetchInstrumentation.setTracerProvider(provider)
  fetchInstrumentation.enable()
  
  console.log('✅ Frontend OpenTelemetry başlatıldı')
}

// Tracer al - custom span'ler için
export function getTracer(name: string = 'frontend') {
  return trace.getTracer(name) // Global tracer provider'dan tracer al
}

