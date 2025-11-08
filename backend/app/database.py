# database.py - Veritabanı bağlantı yönetimi
# SQLite veritabanı için async connection setup

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker  # SQLAlchemy async komponentleri
from sqlalchemy.orm import declarative_base  # Model sınıfları için base class
from app.config import settings  # Ayarlarımızı import ediyoruz


# Database Engine - Veritabanı motoru oluştur
# echo=True -> SQL sorgularını console'a yazdırır (debug için yararlı)
engine = create_async_engine(
    settings.DATABASE_URL,  # .env'den gelen DATABASE_URL
    echo=settings.DEBUG,  # DEBUG=True ise SQL'leri yazdır
    future=True,  # SQLAlchemy 2.0 API'sini kullan
)

# Session Factory - Her request için yeni session oluşturmak için kullanılır
# expire_on_commit=False -> Commit sonrası nesneler expire olmasın (async için önemli)
AsyncSessionLocal = async_sessionmaker(
    engine,  # Yukarıda oluşturduğumuz engine
    class_=AsyncSession,  # AsyncSession sınıfını kullan
    expire_on_commit=False,  # Commit sonrası nesneleri tekrar yükleme
)

# Base Class - Tüm model sınıfları bu base'den türeyecek
# Örnek: class Conversation(Base): ...
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Database session dependency - FastAPI route'larında kullanılacak
    Her request için yeni bir session oluşturur ve request bitince kapatır
    
    Kullanım örneği:
    @app.get("/api/conversations")
    async def get_conversations(db: AsyncSession = Depends(get_db)):
        # db ile veritabanı işlemleri yap
    """
    async with AsyncSessionLocal() as session:  # Yeni session aç
        try:
            yield session  # Session'ı route'a ver
        finally:
            await session.close()  # İşlem bitince session'ı kapat


async def init_db():
    """
    Veritabanını başlat - tablolarını oluştur
    Uygulama başlarken bir kez çalıştırılır
    
    Not: Models import edildikten sonra çalışmalı
    """
    # Modelleri import et - Base.metadata.create_all() görebilmesi için gerekli
    from app.models import Conversation, Message  # noqa: F401 - Import kullanılmıyor gibi görünse de Base.metadata için gerekli
    
    async with engine.begin() as conn:  # Connection aç
        # Base'e bağlı tüm model tablolarını oluştur (CREATE TABLE IF NOT EXISTS)
        await conn.run_sync(Base.metadata.create_all)

