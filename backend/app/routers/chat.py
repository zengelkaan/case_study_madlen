# chat.py - Sohbet (chat) için API endpoint'leri
# Mesaj gönderme, sohbet geçmişi, vb.

from fastapi import APIRouter, Depends  # FastAPI routing ve dependency
from fastapi.responses import StreamingResponse  # Streaming response için
from sqlalchemy.ext.asyncio import AsyncSession  # Database session
from sqlalchemy import select  # SQL SELECT query için
from pydantic import BaseModel, Field, validator  # Request/Response model validasyonu için
from typing import Optional  # Type hints
from datetime import datetime  # Timestamp için
from app.database import get_db  # Database session dependency
from app.models.conversation import Conversation  # Conversation model
from app.models.message import Message  # Message model
from app.services.openrouter import openrouter_service  # OpenRouter servisi
from app.services import temporary_sessions  # Temporary session yönetimi - memory'de
from app.exceptions import ConversationNotFoundException, MessageNotFoundException, ValidationException, OpenRouterAPIException  # Custom exception'lar


# Router oluştur - tüm chat endpoint'leri /api/chat prefix'i ile
router = APIRouter(
    prefix="/api/chat",  # URL prefix - örn: /api/chat/send
    tags=["chat"]  # Swagger'da gruplandırma için tag
)


# Request Models - Mesaj düzenleme için
class EditMessageRequest(BaseModel):
    """
    Mesaj düzenleme isteği
    """
    content: str = Field(
        ...,  # Zorunlu
        min_length=1,
        max_length=10000,
        description="Düzenlenmiş mesaj içeriği"
    )
    
    @validator('content')
    def content_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValidationException("Mesaj boş olamaz")
        return v.strip()


# Request Models - API'ye gelen verilerin yapısı
class ChatRequest(BaseModel):
    """
    Chat mesajı gönderme isteği
    Frontend'den gelen verinin formatı
    Pydantic ile otomatik validation yapılır
    """
    conversation_id: Optional[int] = Field(
        None,  # Opsiyonel - None ise yeni conversation
        gt=0,  # Greater than 0 - pozitif olmalı
        description="Mevcut conversation ID (yoksa yeni oluşturulur)"
    )
    model: str = Field(
        ...,  # Zorunlu field
        min_length=1,  # Minimum 1 karakter
        description="Kullanılacak AI model ID'si"
    )
    message: str = Field(
        ...,  # Zorunlu field
        min_length=1,  # Minimum 1 karakter
        max_length=10000,  # Maximum 10000 karakter (çok uzun mesajları engelle)
        description="Kullanıcının mesajı"
    )
    image_url: Optional[str] = Field(
        None,  # Opsiyonel - resim yoksa None
        description="Resim URL'i veya base64 encoded image (vision model'ler için)"
    )  # Vision model'ler için resim desteği - base64 string veya URL
    is_temporary: bool = Field(
        default=False,  # Varsayılan: kalıcı sohbet
        description="Geçici sohbet mi - true ise database'e kaydedilmez"
    )  # Geçici sohbet flag - true ise memory'de tutulur, database'e yazılmaz
    conversation_title: Optional[str] = Field(
        None,  # Opsiyonel
        max_length=200,  # Maximum 200 karakter
        description="Yeni conversation için başlık (opsiyonel)"
    )
    
    @validator('message')
    def message_must_not_be_empty(cls, v):
        """
        Message validation - boşluk karakterlerinden oluşmamalı
        """
        if not v or not v.strip():  # Boş veya sadece boşluk
            raise ValidationException("Mesaj boş olamaz")
        return v.strip()  # Baş ve son boşlukları temizle
    
    @validator('model')
    def model_must_be_valid(cls, v):
        """
        Model validation - format kontrolü
        """
        if not v or not v.strip():  # Boş veya sadece boşluk
            raise ValidationException("Model adı boş olamaz")
        if "/" not in v:  # Model ID formatı kontrolü
            raise ValidationException("Geçersiz model formatı")
        return v.strip()  # Baş ve son boşlukları temizle


# Response Models - API'den dönen verilerin yapısı
class ChatResponse(BaseModel):
    """
    Chat cevabı
    Frontend'e dönen verinin formatı
    """
    conversation_id: int  # Sohbet ID'si
    message: str  # AI'ın cevabı
    model: str  # Kullanılan model
    timestamp: datetime  # Mesaj zamanı


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,  # Request body - ChatRequest formatında
    db: AsyncSession = Depends(get_db)  # Database session - dependency injection
):
    """
    Kullanıcı mesajı gönder ve AI cevabını al
    Temporary mode: is_temporary=true ise database'e kaydetmez (memory only)
    
    Args:
        request: Chat isteği (conversation_id, model, message, is_temporary)
        db: Database session
        
    Returns:
        ChatResponse: AI'ın cevabı
    """
    
    # === TEMPORARY MODE KONTROLÜ ===
    if request.is_temporary:
        # Geçici sohbet - database'e KAYDETME, sadece memory kullan
        # Not: Bu fonksiyon şimdilik temporary desteklemiyor, stream endpoint'i kullanın
        raise ValidationException("Geçici sohbet için /api/chat/stream endpoint'ini kullanın")
    
    # === NORMAL MODE (Database) ===
    # 1. Conversation kontrolü - var mı yok mu?
    if request.conversation_id:
        # Mevcut conversation'ı bul
        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()  # Bulamazsa None döner
        
        if not conversation:  # Conversation bulunamadı
            raise ConversationNotFoundException(request.conversation_id)  # 404 + custom message
    else:
        # Yeni conversation oluştur
        conversation = Conversation(
            title=request.conversation_title or "Yeni Sohbet",  # Başlık yoksa default
            model_name=request.model  # Kullanılan model
        )
        db.add(conversation)  # Database'e ekle
        await db.commit()  # Commit et (ID atanır)
        await db.refresh(conversation)  # Refresh et (created_at gibi alanlar doldurulur)
    
    # 2. Kullanıcı mesajını veritabanına kaydet (resim varsa onunla birlikte)
    user_message = Message(
        conversation_id=conversation.id,  # Hangi conversation'a ait
        role="user",  # Kullanıcı mesajı
        content=request.message,  # Mesaj içeriği
        model_name=None,  # Kullanıcı mesajında model yok
        image_url=request.image_url  # Resim URL'i (varsa) - vision model'ler için
    )
    db.add(user_message)  # Database'e ekle
    await db.commit()  # Kaydet
    
    # 3. Sohbet geçmişini hazırla - OpenRouter'a gönderilecek (multimodal desteği ile)
    # Bu conversation'daki tüm mesajları al
    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.timestamp.asc())  # Eskiden yeniye sırala
    )
    all_messages = messages_result.scalars().all()  # Tüm mesajları liste olarak al
    
    # OpenRouter formatına çevir - resim varsa multimodal format kullan
    chat_history = []
    for msg in all_messages:
        if msg.image_url:
            # Resimli mesaj - multimodal format (OpenRouter vision model'ler için)
            chat_history.append({
                "role": msg.role,  # user veya assistant
                "content": [
                    {"type": "text", "text": msg.content},  # Text kısmı
                    {"type": "image_url", "image_url": {"url": msg.image_url}}  # Resim kısmı
                ]
            })
        else:
            # Normal mesaj - sadece text
            chat_history.append({
                "role": msg.role,
                "content": msg.content  # Basit string format
            })
    
    # 4. OpenRouter'a gönder - AI cevabını al
    ai_response = await openrouter_service.chat_completion(
        model=request.model,  # Kullanılacak model
        messages=chat_history,  # Sohbet geçmişi
        stream=False  # Normal mode (streaming değil)
    )
    
    # Hata kontrolü
    if ai_response.get("error"):  # API hatası döndü
        error_message = ai_response.get("message", "AI modelinden cevap alınamadı")
        raise OpenRouterAPIException(error_message)  # 503 + custom message
    
    # AI cevabını çıkar (OpenRouter response formatı)
    ai_message_content = ai_response.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    if not ai_message_content:  # Boş cevap geldi
        raise OpenRouterAPIException("AI'dan boş cevap alındı")  # 503 + custom message
    
    # 5. AI cevabını veritabanına kaydet (model bilgisi ile birlikte)
    ai_message = Message(
        conversation_id=conversation.id,
        role="assistant",  # AI mesajı
        content=ai_message_content,
        model_name=request.model  # Kullanılan model - önemli!
    )
    db.add(ai_message)  # Database'e ekle
    await db.commit()  # Kaydet
    await db.refresh(ai_message)  # Timestamp'i al
    
    # 6. Response döndür
    return ChatResponse(
        conversation_id=conversation.id,
        message=ai_message_content,  # AI'ın cevabı
        model=request.model,
        timestamp=ai_message.timestamp
    )


@router.post("/stream")
async def send_message_stream(
    request: ChatRequest,  # Chat isteği
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Streaming chat - AI cevabını parça parça al
    Temporary mode desteği: is_temporary=true ise database'e kaydetmez
    
    Normal mode: Database'e kaydeder
    Temporary mode: Memory'de tutar, database'e yazmaz
    """
    
    # === TEMPORARY MODE KONTROLÜ ===
    if request.is_temporary:
        # TEMPORARY MODE - Database'e KAYDETME
        
        # Session ID kontrolü - negatif ID temporary session
        if request.conversation_id and request.conversation_id < 0:
            session_id = request.conversation_id  # Mevcut temporary session
        else:
            session_id = temporary_sessions.create_temporary_session()  # Yeni temporary session - memory'de
        
        # Kullanıcı mesajını MEMORY'E kaydet - database'e DEĞİL
        temporary_sessions.add_message_to_session(
            session_id=session_id,  # Temporary session ID (negatif sayı)
            role="user",  # Kullanıcı
            content=request.message,  # Mesaj
            model_name=None,  # Kullanıcı mesajında model yok
            image_url=request.image_url  # Resim (varsa)
        )
        
        # Sohbet geçmişini MEMORY'DEN al - database'den DEĞİL
        all_messages = temporary_sessions.get_session_messages(session_id)
        
        # OpenRouter formatına çevir - memory'deki dict'ler
        chat_history = []
        for msg in all_messages:
            if msg.get("image_url"):  # Resim varsa
                chat_history.append({
                    "role": msg["role"],
                    "content": [
                        {"type": "text", "text": msg["content"]},
                        {"type": "image_url", "image_url": {"url": msg["image_url"]}}
                    ]
                })
            else:  # Sadece text
                chat_history.append({"role": msg["role"], "content": msg["content"]})
        
    else:
        # NORMAL MODE - Database'e kaydet (eski davranış)
        
        # Conversation kontrolü - var mı yok mu?
        if request.conversation_id:
            result = await db.execute(
                select(Conversation).where(Conversation.id == request.conversation_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                raise ConversationNotFoundException(request.conversation_id)  # 404
        else:
            # Yeni conversation oluştur - DATABASE'e
            conversation = Conversation(
                title=request.conversation_title or "Yeni Sohbet",
                model_name=request.model
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
        
        session_id = conversation.id  # Normal conversation ID (pozitif)
        
        # Kullanıcı mesajını DATABASE'E kaydet
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
            model_name=None,  # Kullanıcı mesajında model yok
            image_url=request.image_url
        )
        db.add(user_message)
        await db.commit()
        
        # Sohbet geçmişini DATABASE'DEN al
        messages_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.timestamp.asc())
        )
        all_messages = messages_result.scalars().all()
        
        # OpenRouter formatına çevir - database'deki mesajlar
        chat_history = []
        for msg in all_messages:
            if msg.image_url:
                chat_history.append({
                    "role": msg.role,
                    "content": [
                        {"type": "text", "text": msg.content},
                        {"type": "image_url", "image_url": {"url": msg.image_url}}
                    ]
                })
            else:
                chat_history.append({"role": msg.role, "content": msg.content})
    
    # 4. Streaming generator fonksiyonu - temporary mode desteği ile
    async def generate_stream():
        """AI cevabını parça parça üreten generator - temporary mode destekli"""
        full_response = ""  # Tüm cevabı biriktir
        
        # OpenRouter streaming servisini kullan - chat history'yi gönder
        async for chunk in openrouter_service.chat_completion_stream(
            model=request.model,
            messages=chat_history
        ):
            full_response += chunk  # Parçayı biriktir
            yield chunk  # Frontend'e gönder - kelime kelime
        
        # Stream bitti - AI cevabını kaydet (model bilgisi ile)
        if request.is_temporary:
            # TEMPORARY: Memory'e kaydet - database'e DEĞİL
            temporary_sessions.add_message_to_session(
                session_id=session_id,  # Temporary session ID
                role="assistant",  # AI
                content=full_response,  # AI'ın cevabı
                model_name=request.model  # Kullanılan model
            )
        else:
            # NORMAL: Database'e kaydet
            ai_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
                model_name=request.model  # Kullanılan model - önemli!
            )
            db.add(ai_message)
            await db.commit()
    
    # 5. StreamingResponse döndür - session ID'yi header'a ekle (temporary veya normal)
    return StreamingResponse(
        generate_stream(),  # Generator fonksiyon
        media_type="text/plain",  # Plain text stream
        headers={
            "X-Conversation-Id": str(session_id),  # Session ID - temporary ise negatif, normal ise pozitif
        }
    )


@router.put("/messages/{message_id}")
async def edit_message(
    message_id: int,  # URL'den gelen message ID
    request: EditMessageRequest,  # Düzenlenmiş mesaj içeriği
    db: AsyncSession = Depends(get_db)  # Database session
):
    """
    Kullanıcı mesajını düzenle ve sonraki mesajları sil
    
    Bu endpoint:
    1. Mesajı bulur ve user mesajı olduğunu doğrular
    2. Mesaj içeriğini günceller
    3. O mesajdan sonraki tüm mesajları siler (context değişti çünkü)
    4. Güncellenmiş mesaj bilgisini döndürür
    
    Args:
        message_id: Düzenlenecek mesaj ID'si
        request: Yeni mesaj içeriği
        db: Database session
        
    Returns:
        dict: Güncellenmiş mesaj bilgisi ve conversation ID
    """
    
    # 1. Mesajı bul
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise MessageNotFoundException(message_id)  # 404
    
    # 2. Sadece user mesajları düzenlenebilir
    if message.role != "user":
        raise ValidationException("Sadece kullanıcı mesajları düzenlenebilir")
    
    # 3. Mesajı güncelle
    message.content = request.content
    
    # 4. Bu mesajdan SONRAKI tüm mesajları sil (timestamp'e göre)
    # Context değişti, eski cevaplar artık geçersiz
    delete_result = await db.execute(
        select(Message).where(
            Message.conversation_id == message.conversation_id,
            Message.timestamp > message.timestamp  # Bu mesajdan SONRAKI
        )
    )
    subsequent_messages = delete_result.scalars().all()
    
    for msg in subsequent_messages:
        await db.delete(msg)  # Mesajı sil
    
    await db.commit()  # Değişiklikleri kaydet
    await db.refresh(message)  # Mesajı yenile
    
    # 5. Response döndür
    return {
        "id": message.id,
        "content": message.content,
        "conversation_id": message.conversation_id,
        "deleted_count": len(subsequent_messages),  # Kaç mesaj silindi
        "timestamp": message.timestamp
    }

