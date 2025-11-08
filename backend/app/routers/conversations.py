# conversations.py - Konuşma (conversation) yönetimi için API endpoint'leri
# Conversation listesi, detay, oluşturma, silme işlemleri

from fastapi import APIRouter, Depends  # FastAPI routing ve dependency
from sqlalchemy.ext.asyncio import AsyncSession  # Database session
from sqlalchemy import select, func  # SQL query fonksiyonları
from sqlalchemy.orm import selectinload  # Eager loading - ilişkili verileri yükle
from pydantic import BaseModel, Field, validator  # Request/Response model validasyonu
from typing import List, Optional  # Type hints
from datetime import datetime  # Timestamp için
from app.database import get_db  # Database session dependency
from app.models.conversation import Conversation  # Conversation model
from app.models.message import Message  # Message model
from app.exceptions import ConversationNotFoundException, ValidationException  # Custom exception'lar


# Router oluştur - tüm conversation endpoint'leri /api/conversations prefix'i ile
router = APIRouter(
    prefix="/api/conversations",  # URL prefix - örn: /api/conversations
    tags=["conversations"]  # Swagger'da gruplandırma için tag
)


# Response Models - API'den dönen verilerin yapısı
class MessageResponse(BaseModel):
    """
    Tek bir mesajın response modeli
    """
    id: int  # Mesaj ID'si
    role: str  # Mesaj rolü (user/assistant)
    content: str  # Mesaj içeriği
    model_name: Optional[str] = None  # Bu mesajı oluşturan model (opsiyonel - sadece assistant)
    image_url: Optional[str] = None  # Resim URL (opsiyonel - vision modeller için)
    timestamp: datetime  # Mesaj zamanı
    
    class Config:
        from_attributes = True  # ORM modelinden direkt çevirebilmek için


class ConversationListItem(BaseModel):
    """
    Conversation listesi için item modeli
    Mesajların kendisi değil, sadece özet bilgiler
    """
    id: int  # Conversation ID
    title: str  # Conversation başlığı
    model_name: str  # Kullanılan model
    created_at: datetime  # Oluşturulma zamanı
    message_count: int  # Bu conversation'daki mesaj sayısı
    
    class Config:
        from_attributes = True  # ORM modelinden direkt çevirebilmek için


class ConversationDetail(BaseModel):
    """
    Conversation detayı - mesajlarla birlikte
    """
    id: int  # Conversation ID
    title: str  # Conversation başlığı
    model_name: str  # Kullanılan model
    created_at: datetime  # Oluşturulma zamanı
    messages: List[MessageResponse]  # Bu conversation'daki tüm mesajlar
    
    class Config:
        from_attributes = True  # ORM modelinden direkt çevirebilmek için


class ConversationCreate(BaseModel):
    """
    Yeni conversation oluşturma isteği
    Pydantic ile otomatik validation yapılır
    """
    title: str = Field(
        ...,  # Zorunlu field (... = required)
        min_length=1,  # Minimum 1 karakter
        max_length=200,  # Maximum 200 karakter
        description="Conversation başlığı"  # Swagger'da görünür
    )
    model_name: str = Field(
        ...,  # Zorunlu field
        min_length=1,  # Minimum 1 karakter
        description="Kullanılacak AI model ID'si"  # Swagger'da görünür
    )
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        """
        Title validation - boşluk karakterlerinden oluşmamalı
        """
        if not v or not v.strip():  # Boş veya sadece boşluk
            raise ValidationException("Başlık boş olamaz")  # Custom exception
        return v.strip()  # Baş ve son boşlukları temizle
    
    @validator('model_name')
    def model_name_must_be_valid(cls, v):
        """
        Model name validation - format kontrolü
        """
        if not v or not v.strip():  # Boş veya sadece boşluk
            raise ValidationException("Model adı boş olamaz")
        # Model ID formatı kontrolü (genelde "provider/model" formatında)
        if "/" not in v:  # Slash yoksa geçersiz
            raise ValidationException("Geçersiz model formatı (örn: nvidia/nemotron)")
        return v.strip()  # Baş ve son boşlukları temizle


class ConversationUpdate(BaseModel):
    """
    Conversation güncelleme isteği
    Sadece title güncellenebilir
    """
    title: str = Field(
        ...,  # Zorunlu
        min_length=1,  # Minimum 1 karakter
        max_length=200,  # Maximum 200 karakter
        description="Yeni conversation başlığı"
    )
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        """
        Title validation - boşluk karakterlerinden oluşmamalı
        """
        if not v.strip():  # Sadece boşluk karakterleri - hata
            raise ValidationException("Başlık boş olamaz")  # Custom exception
        return v.strip()  # Baş ve son boşlukları temizle


@router.get("/", response_model=List[ConversationListItem])
async def get_conversations(
    db: AsyncSession = Depends(get_db)  # Database session dependency
):
    """
    Tüm konuşmaları listele
    
    Conversation'ları en yeni en üstte olacak şekilde sıralar.
    Her conversation için mesaj sayısını da döner.
    
    Returns:
        List[ConversationListItem]: Conversation listesi
    """
    # Conversation'ları ve her birinin mesaj sayısını al
    # subquery ile her conversation için mesaj sayısını hesapla
    result = await db.execute(
        select(
            Conversation,  # Conversation objesini al
            func.count(Message.id).label("message_count")  # Mesaj sayısını say
        )
        .outerjoin(Message, Conversation.id == Message.conversation_id)  # Messages ile join (left join)
        .group_by(Conversation.id)  # Her conversation için grupla
        .order_by(Conversation.created_at.desc())  # En yeni en üstte
    )
    
    # Sonuçları liste olarak al
    rows = result.all()
    
    # Response formatına çevir
    conversations = [
        ConversationListItem(
            id=row.Conversation.id,
            title=row.Conversation.title,
            model_name=row.Conversation.model_name,
            created_at=row.Conversation.created_at,
            message_count=row.message_count  # Hesaplanan mesaj sayısı
        )
        for row in rows
    ]
    
    return conversations  # Liste döndür


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation_detail(
    conversation_id: int,  # URL'den gelen conversation ID
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Belirli bir konuşmanın detayını getir
    
    Conversation'ı ve tüm mesajlarını döner.
    Mesajlar kronolojik sırada (eskiden yeniye).
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        ConversationDetail: Conversation ve tüm mesajları
    """
    # Conversation'ı bul - mesajlarını da eager load et (N+1 query problemini önle)
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))  # Mesajları da yükle (eager loading)
        .where(Conversation.id == conversation_id)  # ID'ye göre filtrele
    )
    conversation = result.scalar_one_or_none()  # Tek bir sonuç al (yoksa None)
    
    # Conversation bulunamadıysa custom exception fırlat
    if not conversation:
        raise ConversationNotFoundException(conversation_id)  # 404 + custom message
    
    # Mesajları timestamp'e göre sırala (eskiden yeniye)
    sorted_messages = sorted(conversation.messages, key=lambda m: m.timestamp)
    
    # Response formatına çevir
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        model_name=conversation.model_name,
        created_at=conversation.created_at,
        messages=[
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                model_name=msg.model_name,  # Model bilgisini dahil et
                image_url=msg.image_url,  # Resim URL'i (varsa)
                timestamp=msg.timestamp
            )
            for msg in sorted_messages
        ]
    )


@router.post("/", response_model=ConversationDetail)
async def create_conversation(
    request: ConversationCreate,  # Request body - yeni conversation bilgileri
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Yeni bir konuşma oluştur
    
    Boş bir conversation oluşturur (henüz mesaj yok).
    İlk mesaj /api/chat/send endpoint'i ile gönderilebilir.
    
    Args:
        request: Yeni conversation bilgileri (title, model_name)
        
    Returns:
        ConversationDetail: Oluşturulan conversation
    """
    # Yeni conversation objesi oluştur
    new_conversation = Conversation(
        title=request.title,  # Kullanıcıdan gelen başlık
        model_name=request.model_name  # Kullanılacak model
        # created_at otomatik atanır (database default)
    )
    
    # Database'e ekle
    db.add(new_conversation)
    await db.commit()  # Commit et (ID atanır)
    await db.refresh(new_conversation)  # Refresh et (created_at gibi alanlar doldurulur)
    
    # Response döndür (boş mesaj listesi ile)
    return ConversationDetail(
        id=new_conversation.id,
        title=new_conversation.title,
        model_name=new_conversation.model_name,
        created_at=new_conversation.created_at,
        messages=[]  # Henüz mesaj yok
    )


@router.patch("/{conversation_id}", response_model=ConversationListItem)
async def update_conversation(
    conversation_id: int,  # URL'den gelen conversation ID
    request: ConversationUpdate,  # Request body - yeni title
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Bir konuşmanın başlığını güncelle
    
    Conversation'ın sadece title field'ını günceller.
    Diğer alanlar (model_name, created_at) değişmez.
    
    Args:
        conversation_id: Güncellenecek conversation ID
        request: Yeni başlık bilgisi
        
    Returns:
        ConversationListItem: Güncellenmiş conversation
    """
    # Önce conversation'ın var olup olmadığını kontrol et
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()  # Conversation'ı bul
    
    # Conversation bulunamadıysa custom exception fırlat
    if not conversation:
        raise ConversationNotFoundException(conversation_id)  # 404 + custom message
    
    # Title'ı güncelle
    conversation.title = request.title  # Yeni başlık
    
    # Database'e kaydet
    await db.commit()  # Commit et
    await db.refresh(conversation)  # Refresh et (güncel veriyi al)
    
    # Mesaj sayısını hesapla
    messages_result = await db.execute(
        select(func.count(Message.id))
        .where(Message.conversation_id == conversation.id)
    )
    message_count = messages_result.scalar() or 0  # Mesaj sayısı (yoksa 0)
    
    # Response formatına çevir
    return ConversationListItem(
        id=conversation.id,
        title=conversation.title,
        model_name=conversation.model_name,
        created_at=conversation.created_at,
        message_count=message_count  # Hesaplanan mesaj sayısı
    )


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,  # URL'den gelen conversation ID
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Bir konuşmayı sil
    
    Conversation'ı ve ona ait tüm mesajları siler.
    Cascade delete sayesinde mesajlar otomatik silinir.
    
    Args:
        conversation_id: Silinecek conversation ID
        
    Returns:
        Dict: Başarı mesajı
    """
    # Önce conversation'ın var olup olmadığını kontrol et
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()  # Conversation'ı bul
    
    # Conversation bulunamadıysa custom exception fırlat
    if not conversation:
        raise ConversationNotFoundException(conversation_id)  # 404 + custom message
    
    # Conversation'ı sil (cascade ile messages de silinir)
    await db.delete(conversation)  # Silme işlemi
    await db.commit()  # Commit et
    
    # Başarı mesajı döndür
    return {
        "success": True,  # İşlem başarılı
        "message": f"Conversation {conversation_id} başarıyla silindi",
        "deleted_id": conversation_id  # Silinen ID
    }

