# models/__init__.py - Model paketini başlat ve modelleri export et
# Bu dosya models paketinin giriş noktasıdır

# Modelleri import et - database.py'nin Base.metadata.create_all() görebilmesi için
from app.models.conversation import Conversation  # Conversation modelini import et
from app.models.message import Message  # Message modelini import et

# Public API - bu paketten import edilebilecek sınıflar
__all__ = ["Conversation", "Message"]  # from app.models import * yapıldığında bunlar import edilir
