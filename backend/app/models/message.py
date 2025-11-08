# message.py - Message (Mesaj) veritabanı modeli
# Bu tablo tüm sohbet mesajlarını saklar (hem kullanıcı hem AI mesajları)

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey  # SQLAlchemy veri tipleri
from sqlalchemy.orm import relationship  # İlişkiler için (Message -> Conversation)
from sqlalchemy.sql import func  # SQL fonksiyonları (CURRENT_TIMESTAMP için)
from app.database import Base  # Base class - tüm modeller bundan türer


class Message(Base):
    """
    Message Model - Sohbet mesajlarını temsil eder
    Her message bir conversation'a aittir
    """
    
    __tablename__ = "messages"  # Tablo adı - veritabanında "messages" olarak oluşturulur
    
    # Sütunlar (Columns)
    id = Column(Integer, primary_key=True, index=True)  # Birincil anahtar - otomatik artan ID
    
    conversation_id = Column(
        Integer,  # Tamsayı tipi
        ForeignKey("conversations.id", ondelete="CASCADE"),  # Foreign key - conversations tablosuna referans, conversation silinince mesajlar da silinir
        nullable=False,  # NULL olamaz - her mesaj bir conversation'a ait olmalı
        index=True  # Index oluştur - sorgulamaları hızlandırır
    )  # Bu mesajın ait olduğu conversation'ın ID'si
    
    role = Column(
        String,  # String tipi
        nullable=False  # NULL olamaz
    )  # Mesajın rolü: "user" (kullanıcı) veya "assistant" (AI)
    
    content = Column(
        Text,  # Text tipi - uzun metinler için (String'den daha büyük)
        nullable=False  # NULL olamaz - boş mesaj olamaz
    )  # Mesajın içeriği - kullanıcının sorusu veya AI'ın cevabı
    
    model_name = Column(
        String,  # String tipi
        nullable=True  # NULL olabilir - eski mesajlar için geriye dönük uyumluluk
    )  # Bu mesajı oluşturan AI modelinin adı - sadece assistant mesajlarında dolu
    
    image_url = Column(
        Text,  # Text tipi - base64 encoded image veya URL (çok uzun olabilir)
        nullable=True  # NULL olabilir - her mesajda resim olmayabilir
    )  # Resim URL'i veya base64 string - vision model'ler için (opsiyonel)
    
    timestamp = Column(
        DateTime(timezone=True),  # Tarih-saat sütunu - timezone bilgisi ile
        server_default=func.now(),  # Varsayılan değer - kayıt oluşturulurken otomatik şu anki zaman
        nullable=False  # NULL olamaz
    )  # Mesajın gönderilme zamanı - otomatik atanır
    
    # İlişkiler (Relationships)
    conversation = relationship(
        "Conversation",  # İlişkili model - Conversation modeliyle bağlantı
        back_populates="messages"  # Ters ilişki - Conversation modelindeki "messages" ile eşleşir
    )  # Bu mesajın ait olduğu conversation
    
    def __repr__(self):
        """
        Model'in string temsili - debug için yararlı
        Örnek: <Message id=1 role=user conversation_id=1>
        """
        return f"<Message id={self.id} role={self.role} conversation_id={self.conversation_id}>"

