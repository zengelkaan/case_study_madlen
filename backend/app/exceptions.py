# exceptions.py - Custom exception sınıfları ve error handling
# Uygulama genelinde kullanılacak özel exception'lar

from fastapi import HTTPException, status  # FastAPI exception'ları


class AppException(HTTPException):
    """
    Uygulama base exception - tüm custom exception'lar bundan türer
    HTTPException'dan türer, bu sayede FastAPI tarafından otomatik handle edilir
    """
    
    def __init__(
        self,
        status_code: int,  # HTTP status code - 400, 404, 500 vb.
        detail: str,  # Hata mesajı - kullanıcıya gösterilecek
        error_code: str = None  # Custom error code - frontend için (opsiyonel)
    ):
        """
        Custom exception oluşturucu
        
        Args:
            status_code: HTTP status code
            detail: Kullanıcı dostu hata mesajı
            error_code: Custom error code (örn: "CONVERSATION_NOT_FOUND")
        """
        super().__init__(status_code=status_code, detail=detail)  # HTTPException'ı başlat
        self.error_code = error_code  # Custom error code sakla


class ConversationNotFoundException(AppException):
    """
    Conversation bulunamadığında fırlatılır
    HTTP 404 Not Found
    """
    
    def __init__(self, conversation_id: int):
        """
        Args:
            conversation_id: Bulunamayan conversation ID'si
        """
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,  # 404 Not Found
            detail=f"Conversation ID {conversation_id} bulunamadı",  # Kullanıcı dostu mesaj
            error_code="CONVERSATION_NOT_FOUND"  # Custom error code
        )


class MessageNotFoundException(AppException):
    """
    Message bulunamadığında fırlatılır
    HTTP 404 Not Found
    """
    
    def __init__(self, message_id: int):
        """
        Args:
            message_id: Bulunamayan message ID'si
        """
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,  # 404 Not Found
            detail=f"Mesaj ID {message_id} bulunamadı",  # Kullanıcı dostu mesaj
            error_code="MESSAGE_NOT_FOUND"  # Custom error code
        )


class OpenRouterAPIException(AppException):
    """
    OpenRouter API hatası - AI servisi ile iletişimde sorun olduğunda
    HTTP 503 Service Unavailable
    """
    
    def __init__(self, detail: str = "AI servisine bağlanılamadı"):
        """
        Args:
            detail: Hata detayı (opsiyonel, default mesaj var)
        """
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,  # 503 Service Unavailable
            detail=detail,  # Hata mesajı
            error_code="OPENROUTER_API_ERROR"  # Custom error code
        )


class ValidationException(AppException):
    """
    Validasyon hatası - input verileri geçersiz olduğunda
    HTTP 400 Bad Request
    """
    
    def __init__(self, detail: str):
        """
        Args:
            detail: Validasyon hata mesajı
        """
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,  # 400 Bad Request
            detail=detail,  # Validasyon hata mesajı
            error_code="VALIDATION_ERROR"  # Custom error code
        )

