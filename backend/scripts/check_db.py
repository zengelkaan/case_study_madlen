#!/usr/bin/env python3
# check_db.py - Database içeriğini kontrol et
# Kullanım: python check_db.py

import sqlite3
from datetime import datetime

# Database'e bağlan
conn = sqlite3.connect('chat_app.db')
cursor = conn.cursor()

print("=" * 60)
print("📊 DATABASE DURUMU")
print("=" * 60)

# Tabloları listele
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"\n✅ Toplam Tablo Sayısı: {len(tables)}")
for table in tables:
    print(f"   • {table[0]}")

print("\n" + "=" * 60)
print("📋 CONVERSATIONS TABLOSU")
print("=" * 60)

# Conversations tablosu istatistikleri
cursor.execute("SELECT COUNT(*) FROM conversations")
conv_count = cursor.fetchone()[0]
print(f"Toplam Kayıt: {conv_count}")

if conv_count > 0:
    cursor.execute("SELECT * FROM conversations LIMIT 5")
    conversations = cursor.fetchall()
    print("\n📝 Son 5 Kayıt:")
    for conv in conversations:
        print(f"   ID: {conv[0]} | Başlık: {conv[1]} | Model: {conv[2]} | Tarih: {conv[3]}")
else:
    print("⚠️  Henüz kayıt yok")

print("\n" + "=" * 60)
print("💬 MESSAGES TABLOSU")
print("=" * 60)

# Messages tablosu istatistikleri
cursor.execute("SELECT COUNT(*) FROM messages")
msg_count = cursor.fetchone()[0]
print(f"Toplam Kayıt: {msg_count}")

if msg_count > 0:
    cursor.execute("SELECT * FROM messages LIMIT 5")
    messages = cursor.fetchall()
    print("\n📝 Son 5 Mesaj:")
    for msg in messages:
        content_preview = msg[3][:50] + "..." if len(msg[3]) > 50 else msg[3]
        print(f"   ID: {msg[0]} | Conv: {msg[1]} | Role: {msg[2]} | İçerik: {content_preview}")
else:
    print("⚠️  Henüz mesaj yok")

print("\n" + "=" * 60)

# Bağlantıyı kapat
conn.close()

