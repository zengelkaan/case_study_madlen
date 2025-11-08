# routers/__init__.py - Router paketini başlat ve export et
# Tüm router'lar buradan export edilir

from app.routers.models import router as models_router  # Models router'ı import et
from app.routers.chat import router as chat_router  # Chat router'ı import et
from app.routers.conversations import router as conversations_router  # Conversations router'ı import et

# Public API - bu paketten import edilebilecek router'lar
__all__ = ["models_router", "chat_router", "conversations_router"]  # Export edilen router'lar
