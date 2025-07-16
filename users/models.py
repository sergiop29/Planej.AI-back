from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# Create your models here.

class User(AbstractUser):
    # Campos adicionais podem ser adicionados aqui futuramente
    pass

class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    conversation_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversa {self.conversation_id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=[('user', 'Usuário'), ('agent', 'Agente')])
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.text[:30]}..."

class FinancialRecord(models.Model):
    data = models.CharField(max_length=50, blank=True)
    cliente_fornecedor = models.CharField(max_length=255, blank=True)
    descricao = models.CharField(max_length=255, blank=True)
    categoria = models.CharField(max_length=100, blank=True)
    valor = models.CharField(max_length=50, blank=True)
    tipo = models.CharField(max_length=50, blank=True)
    forma_pagamento = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.data} - {self.descricao} - {self.valor}"
