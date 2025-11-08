# Madlen AI Chat Application

Modern, yerel olarak çalışan web tabanlı AI sohbet uygulaması. OpenRouter API üzerinden çeşitli AI modellerine tek bir arayüzden erişim sağlar.

## Proje Gereksinimleri - Tamamlanan Özellikler

### Backend API Servisi (FastAPI)
- **RESTful API** - FastAPI ile async/await desteği
- **Sohbet Yönetimi** - Mesaj kaydetme, geçmiş sorgulama
- **Model Seçimi** - Dinamik model listesi endpoint'i
- **Güvenli API Key Yönetimi** - `.env` ile environment variable
- **Otomatik Dokümantasyon** - Swagger UI (`/docs`)

### Lokal Web Arayüzü (React + TypeScript)
- **Modern UI** - React 18 + TypeScript + Vite
- **Sohbet Arayüzü** - Mesaj yazma, AI cevabı görüntüleme
- **Responsive Design** - Mobil uyumlu, Tailwind CSS
- **Real-time Streaming** - AI cevapları kelime kelime görünür

### OpenRouter Entegrasyonu
- **Güvenli API Key** - `.env` dosyası ile yönetim
- **Çoklu Model Desteği** - Ücretsiz ve ücretli modeller
- **Error Handling** - API hatalarında kullanıcı dostu mesajlar

### Model Seçimi
- **Dropdown Menü** - Tüm mevcut modeller
- **Ücretsiz Modeller** - Filtreleme özelliği
- **Model Detayları** - Token limiti, fiyat, vision desteği

### Sohbet Geçmişi
- **Tam Kayıt** - Tüm mesajlar database'de
- **Görüntüleme** - Kullanıcı ve AI mesajları
- **Yönetim** - Conversation silme, düzenleme

### OpenTelemetry Entegrasyonu
- **Backend Tracing** - FastAPI + HTTPX instrumentation (gRPC port 4317)
- **Frontend Tracing** - Fetch API instrumentation (HTTP port 4318)
- **Jaeger UI** - Docker ile yerel Jaeger backend
- **Kritik İşlemler Trace Ediliyor:**
  - API çağrıları (HTTP request/response)
  - OpenRouter API iletişimi
  - Kullanıcı etkileşimleri (mesaj gönderme, model seçimi)
  - Conversation yönetimi
  - Mesaj düzenleme

---

## Teknoloji Stack

### Backend
- **FastAPI** - Async, type-safe Python framework
- **SQLite** - File-based database, zero-config
- **HTTPX** - Async HTTP client (OpenRouter için)
- **OpenTelemetry** - Distributed tracing
- **Pydantic** - Data validation

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering

### Observability
- **Jaeger** - Tracing UI (Docker)
- **OpenTelemetry SDK** - Backend (gRPC) + Frontend (HTTP)

---

## Gereksinimler

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- OpenRouter API Key

---

## Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/zengelkaan/case_study_madlen.git
cd case_study_madlen
```

### 2. Backend Kurulumu

```bash
cd backend

# Virtual environment oluştur
python3 -m venv venv

# Aktifleştir (macOS/Linux)
source venv/bin/activate
# Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Environment variables ayarla
cp .env.example .env
# .env dosyasını düzenleyip OPENROUTER_API_KEY ekleyin
```

**Önemli:** `.env` dosyasında `OPENROUTER_API_KEY=your_actual_key` satırını gerçek API key'inizle değiştirin.

### 3. Frontend Kurulumu

```bash
cd ../frontend

# Bağımlılıkları yükle
npm install

### 4. Jaeger Başlatma (Telemetry)

```bash
cd ..
docker-compose up -d
```

**Not:** Container isim çakışması hatası alırsanız: `docker stop madlen-jaeger && docker rm madlen-jaeger` komutuyla eski container'ı temizleyin.

---

## Uygulamayı Çalıştırma

### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend: http://localhost:8000
Swagger API: http://localhost:8000/docs

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173

### Jaeger UI

Jaeger: http://localhost:16686

**Not:** Port 5173 meşgulse Vite otomatik olarak alternatif port seçer (5174, 5175...). CORS ayarları tüm portları destekler.

---

## Değerlendirme Kriterleri - Nasıl Karşılandı?

### 1. Developer Experience (DX) 

**Soru:** "Projenin kurulumu ve çalıştırılması ne kadar basit ve pürüzsüz? Farklı sistemlerde sorunsuzca çalışması için aldığınız önlemler var mı?"

**Cevap:**

- **Minimal Bağımlılık** - Sadece Python, Node.js ve Docker
- **3 Komutla Çalışır** - docker-compose + uvicorn + npm run dev
- **Otomatik Setup** - SQLite database otomatik oluşturulur, tablolar migrate edilir
- **Cross-Platform** - Windows, macOS, Linux'ta çalışır
- **.env.example** - Tüm gerekli environment variables örnekli
- **Esnek Port Yönetimi** - Port çakışması durumunda otomatik alternatif port
- **Zero External Services** - Database server, cache server gibi ek kurulum yok
- **Hot Reload** - Backend ve Frontend development sırasında otomatik reload
- **Type Safety** - TypeScript + Python type hints (daha az hata)

### 2. User Experience (UX) 

**Soru:** "Arayüz ne kadar akıcı ve sezgisel? Kullanıcıya anlık geri bildirimler veriliyor mu? Genel his ne kadar profesyonel?"

**Cevap:**

- **Streaming Responses** - AI cevapları real-time, kelime kelime görünür (ChatGPT benzeri)
- **Loading States** - Her işlemde loading indicator (skeleton, spinner)
- **Error Messages** - Türkçe, anlaşılır, actionable hata mesajları
- **Dark Mode** - Göz dostu tema, otomatik sistem tercihi
- **Markdown Rendering** - Kod blokları syntax highlighting ile
- **Image Upload** - Vision model'ler için resim desteği
- **Message Editing** - Gönderilen mesajları düzenleyip yeniden gönderme
- **Visual Feedback** - Hover effects, transitions, animations

### 3. Robustness 

**Soru:** "Uygulama beklenmedik durumlara karşı ne kadar dayanıklı? Kullanıcıya anlamlı hata mesajları gösteriliyor mu?"

**Cevap:**

- **Global Error Handlers** - Backend'de tüm exception'lar yakalanır
- **Error Boundary** - Frontend'de React error boundary
- **Input Validation** - Pydantic ile otomatik data validation
- **API Error Handling** - OpenRouter API hataları user-friendly mesajlara dönüştürülür
- **Type Safety** - Compile-time hata tespiti (TypeScript + Python types)
- **CORS Configuration** - Multi-port support, güvenli cross-origin
- **Database Integrity** - Foreign keys, cascade delete, ACID transactions
- **Network Error Handling** - Timeout, retry logic, connection errors
- **User-Friendly Messages** - Teknik hatalar Türkçe açıklamaya dönüştürülür
  - Örnek: "503 Service Unavailable" → "AI servisi şu an kullanılamıyor"

---

## Ekstra Özellikler

Temel gereksinimlerin ötesinde:

- **Temporary Mode** - Privacy-first geçici sohbetler (database'e kaydedilmez)
- **Conversation Search** - Sidebar'da real-time arama (başlık ve model adına göre)
- **Auto-Scroll to Bottom** - Yeni mesajlarda otomatik scroll, smooth animation
- **Message Editing** - Gönderilen mesajları düzenleyip yeniden gönderme
- **Image Upload** - Vision destekli modellerde resim yükleme ve AI'a soru sorma
- **Model Filtering** - Ücretsiz, vision, fiyat bazlı filtreleme
- **Multi-Model Support** - Aynı sohbette farklı modeller kullanabilme
- **Conversation Management** - Başlık düzenleme, silme, kronolojik listeleme

---

## OpenTelemetry Detayları

### Trace Edilen Kritik İşlemler

**Backend:**
- HTTP Endpoints (FastAPI instrumentation)
- OpenRouter API çağrıları (HTTPX instrumentation)
- Sohbet kaydetme, geçmiş sorgulama
- Model listesi çekme

**Frontend:**
- Fetch API çağrıları (otomatik)
- Kullanıcı etkileşimleri (manuel):
  - Mesaj gönderme
  - Model seçimi
  - Conversation değiştirme
  - Mesaj düzenleme

**Jaeger UI'da Görülebilir:**
- End-to-end request timeline
- API response süreleri
- Error trace'leri
- User interaction flow

### Telemetry Konfigürasyonu

```bash
# Jaeger Portları
- 16686: Jaeger UI
- 4318: OTLP HTTP (Frontend)
- 4317: OTLP gRPC (Backend)

# Optimize edilmiş span sayısı
- Anlamlı, temiz trace'ler
```

---

## API Endpoints

### Chat
- `POST /api/chat/stream` - Streaming mesaj gönderme
- `PUT /api/chat/messages/{id}` - Mesaj düzenleme

### Conversations
- `GET /api/conversations/` - Tüm sohbetler
- `GET /api/conversations/{id}` - Sohbet detayı
- `POST /api/conversations/` - Yeni sohbet
- `PUT /api/conversations/{id}` - Başlık güncelleme
- `DELETE /api/conversations/{id}` - Sohbet silme

### Models
- `GET /api/models/` - Mevcut modeller

### Health
- `GET /api/health` - Sistem durumu

**Swagger:** http://localhost:8000/docs

---

## Teknoloji Seçimleri ve Nedenleri

### Backend: FastAPI
- Yüksek performans (async/await)
- Otomatik validation (Pydantic)
- Built-in Swagger dokümantasyonu
- OpenTelemetry desteği

### Frontend: React + TypeScript + Vite
- Type safety (daha az bug)
- Vite (instant HMR, fast build)
- Tailwind (rapid UI development)
- Zustand (minimal state)

### Database: SQLite
- File-based (server kurulumu yok)
- Cross-platform
- Zero configuration
- Lokal uygulama için ideal

### Observability: Jaeger + OpenTelemetry
- Industry standard
- End-to-end tracing
- Docker ile kolay kurulum
- Self-hosted, ücretsiz

---

## Cross-Platform Uyumluluk

### Windows, macOS, Linux Desteği

- **SQLite Database** - Her platformda aynı şekilde çalışır
- **Docker** - Jaeger container izole, dependency conflict yok
- **Environment Variables** - `.env` her platformda aynı
- **Virtual Environment** - Python dependencies izole
- **Package Managers** - pip + npm standart komutlar
- **Port Flexibility** - CORS multi-port destekliyor

**Hot Reload:**
- Backend: Kod değişikliğinde otomatik reload
- Frontend: Instant HMR (< 100ms)

---

## Proje Yapısı

```
.
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   ├── telemetry.py     # OpenTelemetry
│   │   └── main.py          # FastAPI app
│   ├── scripts/             # Utility scripts
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand state
│   │   ├── telemetry/       # OpenTelemetry
│   │   └── types/           # TypeScript types
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
│
└── docker-compose.yml       # Jaeger container
```


**Kaan Zenğel**
