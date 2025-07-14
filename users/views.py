from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User, Conversation, Message
from .serializers import UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Dependências para Langchain
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool
from langchain.prompts import PromptTemplate
import os
from langchain.memory import ConversationBufferMemory
import uuid

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class FinancialAgentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        question = request.data.get('question')
        conversation_id = request.data.get('conversation_id')
        user = request.user if request.user.is_authenticated else None
        if not question:
            return Response({'error': 'Pergunta não fornecida.'}, status=400)

        # Buscar ou criar conversa
        if conversation_id:
            conversation, _ = Conversation.objects.get_or_create(conversation_id=conversation_id, defaults={'user': user})
        else:
            conversation_id = str(uuid.uuid4())
            conversation = Conversation.objects.create(conversation_id=conversation_id, user=user)

        # Buscar histórico de mensagens
        messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
        memory = ConversationBufferMemory(return_messages=True)
        for msg in messages:
            if msg.sender == 'user':
                memory.chat_memory.add_user_message(msg.text)
            else:
                memory.chat_memory.add_ai_message(msg.text)

        # Configurar chave da OpenAI
        openai_api_key = os.getenv('OPENAI_API_KEY', 'SUA_CHAVE_AQUI')
        llm = OpenAI(openai_api_key=openai_api_key, temperature=0.2)

        prompt = PromptTemplate(
            input_variables=["input"],
            template=(
                "Você é um especialista financeiro e em planejamento de pequenos negócios. "
                "Responda de forma clara, objetiva e prática. Pergunta: {input}"
            )
        )

        agent = initialize_agent([], llm, agent="zero-shot-react-description", verbose=False, memory=memory)
        resposta = agent.run(prompt.format(input=question))

        # Salvar pergunta e resposta
        Message.objects.create(conversation=conversation, sender='user', text=question)
        Message.objects.create(conversation=conversation, sender='agent', text=resposta)

        return Response({'resposta': resposta, 'conversation_id': conversation_id})
