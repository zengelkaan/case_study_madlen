# temporary_sessions.py - Geçici sohbet oturumları yönetimi
# Database'e kaydetmeden memory'de temporary chat session'ları tutar
# Server restart olduğunda kaybolur - bu istenen davranış

from typing import Dict, List
from datetime import datetime


# Temporary session data structure - her session için mesaj listesi
# Key: session_id (negatif integer), Value: message listesi
_temporary_sessions: Dict[int, List[Dict]] = {}

# Session ID counter - her yeni temporary session için unique ID
# Negatif sayılar kullanıyoruz - normal conversation ID'leri ile conflict olmaz
_next_session_id: int = -1


def create_temporary_session() -> int:
    """
    Yeni bir geçici sohbet session'ı oluştur
    
    Returns:
        int: Session ID (negatif sayı - örn: -1, -2, -3...)
    """
    global _next_session_id  # Global counter'ı kullan
    
    session_id = _next_session_id  # Yeni session ID
    _next_session_id -= 1  # Counter'ı azalt (bir sonraki için -2, -3...)
    
    _temporary_sessions[session_id] = []  # Boş mesaj listesi ile başla
    
    return session_id  # Session ID döndür


def add_message_to_session(session_id: int, role: str, content: str, model_name: str = None, image_url: str = None) -> None:
    """
    Temporary session'a mesaj ekle
    
    Args:
        session_id: Session ID (negatif sayı)
        role: Mesaj rolü ("user" veya "assistant")
        content: Mesaj içeriği
        model_name: Kullanılan model adı (opsiyonel - assistant mesajlarında dolu)
        image_url: Resim URL (opsiyonel)
    """
    # Session mevcut değilse oluştur
    if session_id not in _temporary_sessions:
        _temporary_sessions[session_id] = []  # Boş liste oluştur
    
    # Mesaj objesi oluştur
    message = {
        "role": role,  # user veya assistant
        "content": content,  # Mesaj içeriği
        "timestamp": datetime.utcnow().isoformat(),  # ISO format timestamp
    }
    
    # Model adı varsa ekle (assistant mesajlarında dolu)
    if model_name:
        message["model_name"] = model_name
    
    # Resim varsa ekle
    if image_url:
        message["image_url"] = image_url  # Resim URL'i ekle
    
    # Session'a mesaj ekle
    _temporary_sessions[session_id].append(message)


def get_session_messages(session_id: int) -> List[Dict]:
    """
    Temporary session'ın mesajlarını al
    
    Args:
        session_id: Session ID
        
    Returns:
        List[Dict]: Mesaj listesi (boş liste dönebilir)
    """
    return _temporary_sessions.get(session_id, [])  # Session yoksa boş liste döndür


def delete_session(session_id: int) -> None:
    """
    Temporary session'ı sil - memory'den kaldır
    
    Args:
        session_id: Session ID
    """
    if session_id in _temporary_sessions:
        del _temporary_sessions[session_id]  # Memory'den sil


def get_active_sessions_count() -> int:
    """
    Aktif temporary session sayısını al - debug/monitoring için
    
    Returns:
        int: Aktif session sayısı
    """
    return len(_temporary_sessions)

