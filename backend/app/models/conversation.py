# conversation.py - Conversation (Sohbet) veritabanı modeli
# Bu tablo tüm sohbet oturumlarını saklar

from sqlalchemy import Column, Integer, String, DateTime  # SQLAlchemy veri tipleri
from sqlalchemy.orm import relationship  # İlişkiler için (Conversation -> Messages)
from sqlalchemy.sql import func  # SQL fonksiyonları (CURRENT_TIMESTAMP için)
from app.database import Base  # Base class - tüm modeller bundan türer


class Conversation(Base):
    """
    Conversation Model - Sohbet oturumlarını temsil eder
    Her conversation birden fazla message içerebilir
    """
    
    __tablename__ = "conversations"  # Tablo adı - veritabanında "conversations" olarak oluşturulur
    
    # Sütunlar (Columns)
    id = Column(Integer, primary_key=True, index=True)  # Birincil anahtar - otomatik artan ID
    title = Column(String, nullable=False)  # Sohbet başlığı - zorunlu alan (NULL olamaz)
    model_name = Column(String, nullable=False)  # Kullanılan AI model adı - zorunlu alan
    created_at = Column(
        DateTime(timezone=True),  # Tarih-saat sütunu - timezone bilgisi ile
        server_default=func.now(),  # Varsayılan değer - kayıt oluşturulurken otomatik şu anki zaman
        nullable=False  # NULL olamaz
    )  # Oluşturulma zamanı - otomatik atanır
    
    # İlişkiler (Relationships)
    messages = relationship(
        "Message",  # İlişkili model - Message modeliyle bağlantı (string olarak - henüz import edilmedi)
        back_populates="conversation",  # Ters ilişki - Message modelindeki "conversation" ile eşleşir
        cascade="all, delete-orphan"  # Cascade işlemi - conversation silinince tüm messages'ları da sil
    )  # Bu conversation'a ait tüm mesajlar
    
    def __repr__(self):
        """
        Model'in string temsili - debug için yararlı
        Örnek: <Conversation id=1 title="Yeni Sohbet">
        """
        return f"<Conversation id={self.id} title={self.title}>"

