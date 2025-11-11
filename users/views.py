from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User, Conversation, Message, FinancialRecord
from .serializers import UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd

# Dependências para LLM e embeddings (usar provedores atuais do ecossistema LangChain)
from langchain_openai import OpenAI, OpenAIEmbeddings
# Vectorstore FAISS permanece na comunidade
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv
load_dotenv()
import uuid
import pickle
from django.db.models import Q
from django.db.models.functions import TruncMonth
from collections import defaultdict
from rest_framework.decorators import api_view

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
        # Montar histórico simples no prompt (evita dependência de langchain.memory)
        history_lines = []
        for msg in messages:
            role = 'Usuário' if msg.sender == 'user' else 'Assistente'
            history_lines.append(f"{role}: {msg.text}")
        history_text = "\n".join(history_lines)

        # Configurar chave da OpenAI
        openai_api_key = os.getenv('OPENAI_API_KEY', 'SUA_CHAVE_AQUI')
        llm = OpenAI(openai_api_key=openai_api_key, temperature=0.2)

        # --- RAG: Buscar contexto relevante no vectorstore ---
        contextos_relevantes = []
        vectorstore_path = f'vectorstores/vectorstore_{conversation_id}.pkl'
        if os.path.exists(vectorstore_path):
            with open(vectorstore_path, 'rb') as f:
                vectorstore = pickle.load(f)
            docs = vectorstore.similarity_search(question, k=3)
            contextos_relevantes = [doc.page_content for doc in docs]
        # Montar contexto para o prompt
        contexto_rag = '\n'.join(contextos_relevantes) if contextos_relevantes else ''

        # Prompt especializado
        system_prompt = (
            "Seu nome é Corujita, uma assistente financeira especialista em pequenos negócios. "
            "Você atende principalmente pequenos empreendedores e responde dúvidas sobre os dados pessoais e financeiros do próprio usuário. "
            "Responda sempre de forma simples, clara, sem usar termos técnicos, e explique tudo de maneira fácil de entender, como se estivesse conversando com alguém leigo. "
            "Seja amigável, didática e detalhada nas explicações, ajudando o usuário a realmente compreender cada resposta. "
            + (f"\nContexto financeiro do usuário: {contexto_rag}" if contexto_rag else "")
        )
        # Montar prompt contendo o sistema, histórico e a nova pergunta
        full_prompt = (
            f"{system_prompt}\n\n" +
            (f"Histórico da conversa:\n{history_text}\n\n" if history_text else "") +
            f"Pergunta: {question}\nResposta:"
        )
        try:
            resposta = llm.predict(full_prompt)
        except Exception as e:
            resposta = "Desculpe, houve um erro ao consultar o agente de IA. Verifique sua chave de API ou tente novamente mais tarde."

        # Salvar pergunta e resposta
        Message.objects.create(conversation=conversation, sender='user', text=question)
        Message.objects.create(conversation=conversation, sender='agent', text=resposta)

        return Response({'resposta': str(resposta), 'conversation_id': conversation_id})

class FinancialRecordListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        records = FinancialRecord.objects.all().order_by('-uploaded_at')
        data = [
            {
                'Data': r.data,
                'Cliente/Fornecedor': r.cliente_fornecedor,
                'Descrição': r.descricao,
                'Categoria': r.categoria,
                'Valor (R$)': r.valor,
                'Tipo': r.tipo,
                'Forma de Pagamento': r.forma_pagamento,
                'Status': r.status,
                'uploaded_at': r.uploaded_at.strftime('%Y-%m-%d %H:%M')
            }
            for r in records
        ]
        return Response(data)

    def delete(self, request):
        FinancialRecord.objects.all().delete()
        return Response({'message': 'Todos os registros financeiros foram excluídos com sucesso!'}, status=204)

class FinancialIndicatorsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        # Receita: soma dos valores onde tipo é Receita
        receitas = FinancialRecord.objects.filter(tipo__iexact='Receita')
        gastos = FinancialRecord.objects.filter(~Q(tipo__iexact='Receita'))
        def parse_valor(valor):
            try:
                return float(str(valor).replace('.', '').replace(',', '.'))
            except:
                return 0.0
        total_receita = sum(parse_valor(r.valor) for r in receitas if r.valor)
        total_gastos = sum(parse_valor(r.valor) for r in gastos if r.valor)
        lucro_liquido = total_receita - total_gastos
        margem_lucro = (lucro_liquido / total_receita * 100) if total_receita else 0.0
        return Response({
            'receita': round(total_receita, 2),
            'gastos': round(total_gastos, 2),
            'lucro_liquido': round(lucro_liquido, 2),
            'margem_lucro': round(margem_lucro, 2)
        })

class FinancialTrendsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        # Agrupar receitas e despesas por mês
        records = FinancialRecord.objects.all()
        trends = defaultdict(lambda: {'receita': 0.0, 'despesa': 0.0})
        def parse_valor(valor):
            try:
                return float(str(valor).replace('.', '').replace(',', '.'))
            except:
                return 0.0
        for r in records:
            # Extrair mês/ano da data (esperando formato dd/mm/yyyy ou yyyy-mm-dd)
            data = str(r.data)
            if '/' in data:
                partes = data.split('/')
                if len(partes[-1]) == 4:
                    mes = partes[1].zfill(2)
                    ano = partes[2]
                else:
                    mes = partes[0].zfill(2)
                    ano = partes[2]
            elif '-' in data:
                partes = data.split('-')
                ano = partes[0]
                mes = partes[1].zfill(2)
            else:
                continue
            chave = f"{ano}-{mes}"
            valor = parse_valor(r.valor)
            if str(r.tipo).strip().lower() == 'receita':
                trends[chave]['receita'] += valor
            else:
                trends[chave]['despesa'] += valor
        # Ordenar por mês
        trends_ordenados = sorted(trends.items())
        labels = [k for k, v in trends_ordenados]
        receitas = [round(v['receita'], 2) for k, v in trends_ordenados]
        despesas = [round(v['despesa'], 2) for k, v in trends_ordenados]
        return Response({
            'labels': labels,
            'receitas': receitas,
            'despesas': despesas
        })

class ExpenseDistributionView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from collections import defaultdict
        despesas = FinancialRecord.objects.exclude(tipo__iexact='Receita')
        categorias = defaultdict(float)
        def parse_valor(valor):
            try:
                return float(str(valor).replace('.', '').replace(',', '.'))
            except:
                return 0.0
        for d in despesas:
            cat = d.categoria or 'Outros'
            categorias[cat] += parse_valor(d.valor)
        labels = list(categorias.keys())
        valores = [round(v, 2) for v in categorias.values()]
        return Response({
            'labels': labels,
            'valores': valores
        })

class ExpenseTypePercentageView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from collections import Counter
        # Filtrar apenas gastos (excluir receitas)
        gastos = FinancialRecord.objects.exclude(tipo__iexact='Receita')
        categorias = [g.categoria or 'Outro' for g in gastos]
        total = len(categorias)
        contagem = Counter(categorias)
        porcentagens = {cat: round((qtd/total)*100, 2) for cat, qtd in contagem.items()} if total > 0 else {}
        return Response(porcentagens)

class CashFlowView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from collections import defaultdict
        records = FinancialRecord.objects.all()
        trends = defaultdict(lambda: {'receita': 0.0, 'despesa': 0.0})
        def parse_valor(valor):
            try:
                return float(str(valor).replace('.', '').replace(',', '.'))
            except:
                return 0.0
        for r in records:
            data = str(r.data)
            if '/' in data:
                partes = data.split('/')
                if len(partes[-1]) == 4:
                    mes = partes[1].zfill(2)
                    ano = partes[2]
                else:
                    mes = partes[0].zfill(2)
                    ano = partes[2]
            elif '-' in data:
                partes = data.split('-')
                ano = partes[0]
                mes = partes[1].zfill(2)
            else:
                continue
            chave = f"{ano}-{mes}"
            valor = parse_valor(r.valor)
            if str(r.tipo).strip().lower() == 'receita':
                trends[chave]['receita'] += valor
            else:
                trends[chave]['despesa'] += valor
        # Ordenar por mês
        trends_ordenados = sorted(trends.items())
        labels = [k for k, v in trends_ordenados]
        fluxo_caixa = [round(v['receita'] - v['despesa'], 2) for k, v in trends_ordenados]
        return Response({
            'labels': labels,
            'fluxo_caixa': fluxo_caixa
        })

class UploadCSVVectorstoreView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Arquivo CSV não enviado.'}, status=400)
        try:
            # Tentar ler o CSV para DataFrame (tratamento robusto de encoding e separador)
            try:
                file.seek(0)
                content = file.read()
                try:
                    decoded = content.decode('utf-8')
                except UnicodeDecodeError:
                    decoded = content.decode('latin1')
                from io import StringIO
                # Detectar separador automaticamente
                import csv
                sample = decoded[:1024]
                sniffer = csv.Sniffer()
                sep = ','
                if sniffer.has_header(sample):
                    dialect = sniffer.sniff(sample)
                    sep = dialect.delimiter
                df = pd.read_csv(StringIO(decoded), sep=sep)
            except Exception as e:
                return Response({'error': f'Erro ao ler o CSV: {str(e)}'}, status=400)
            # Padronizar colunas (normalização)
            import unicodedata
            def normalizar(col):
                return unicodedata.normalize('NFKD', col).encode('ASCII', 'ignore').decode('ASCII').strip().lower().replace('/', '').replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
            colunas_padrao = {
                'data': 'Data',
                'clientefornecedor': 'Cliente/Fornecedor',
                'descricao': 'Descrição',
                'categoria': 'Categoria',
                'valorr$': 'Valor (R$)',
                'tipo': 'Tipo',
                'formadepagamento': 'Forma de Pagamento',
                'status': 'Status'
            }
            # Criar um mapeamento das colunas do CSV para as colunas padrão
            colunas_csv = {normalizar(col): col for col in df.columns}
            # Garantir todas as colunas padrão
            for key, col_padrao in colunas_padrao.items():
                if key not in colunas_csv:
                    df[col_padrao] = ''
            # Recriar DataFrame apenas com as colunas padrão, na ordem correta
            df_padrao = pd.DataFrame()
            for key, col_padrao in colunas_padrao.items():
                if key in colunas_csv:
                    df_padrao[col_padrao] = df[colunas_csv[key]]
                else:
                    df_padrao[col_padrao] = ''
            # Salvar cada linha como um registro no banco de dados
            registros_criados = 0
            for _, row in df_padrao.iterrows():
                FinancialRecord.objects.create(
                    data=row['Data'],
                    cliente_fornecedor=row['Cliente/Fornecedor'],
                    descricao=row['Descrição'],
                    categoria=row['Categoria'],
                    valor=row['Valor (R$)'],
                    tipo=row['Tipo'],
                    forma_pagamento=row['Forma de Pagamento'],
                    status=row['Status']
                )
                registros_criados += 1
            return Response({'message': f'{registros_criados} registros financeiros salvos com sucesso no banco de dados local!'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

def analisar_financeiro_llm(prompt):
    openai_api_key = os.getenv('OPENAI_API_KEY', 'SUA_CHAVE_AQUI')
    llm = OpenAI(openai_api_key=openai_api_key, temperature=0.2)
    try:
        resposta = llm.predict(prompt)
        return resposta
    except Exception as e:
        return None

@api_view(['GET'])
def indice_saude(request):
    # Prompt para nota de 0 a 100 e label
    prompt = (
        "Analise todos os dados financeiros do banco de dados e responda apenas com um JSON no formato: {\"indice\": <nota de 0 a 100>, \"label\": <rótulo curto como Bom, Ruim, Excelente, Regular, etc>}"
    )
    resposta = analisar_financeiro_llm(prompt)
    import json
    try:
        return Response(json.loads(resposta))
    except:
        return Response({'indice': 0, 'label': 'Desconhecido'})

@api_view(['GET'])
def analise_saude(request):
    # Prompt para texto breve
    prompt = (
        "Analise todos os dados financeiros do banco de dados e responda apenas com um texto de no máximo 30 palavras, explicando de forma simples a situação financeira da empresa."
    )
    resposta = analisar_financeiro_llm(prompt)
    texto = resposta.strip() if resposta else ''
    if not texto:
        texto = 'Não foi possível analisar a situação financeira.'
    return Response({'analise': texto})

@api_view(['GET'])
def pontos_fortes(request):
    # Prompt para pontos fortes (apenas 2 frases)
    prompt = (
        "Analise todos os dados financeiros do banco de dados e responda apenas com um JSON no formato: {\"pontos_fortes\": [duas frases curtas, cada uma representando um ponto forte]}"
    )
    resposta = analisar_financeiro_llm(prompt)
    import json
    try:
        data = json.loads(resposta)
        # Garante que só venham 2 frases
        if isinstance(data.get('pontos_fortes'), list):
            data['pontos_fortes'] = data['pontos_fortes'][:2]
        return Response(data)
    except:
        return Response({'pontos_fortes': []})

@api_view(['GET'])
def pontos_fracos(request):
    # Prompt para pontos fracos (apenas 2 frases)
    prompt = (
        "Analise todos os dados financeiros do banco de dados e responda apenas com um JSON no formato: {\"melhorias\": [duas frases curtas, cada uma representando um ponto fraco ou sugestão de melhoria]}"
    )
    resposta = analisar_financeiro_llm(prompt)
    import json
    try:
        data = json.loads(resposta)
        # Garante que só venham 2 frases
        if isinstance(data.get('melhorias'), list):
            data['melhorias'] = data['melhorias'][:2]
        return Response(data)
    except:
        return Response({'melhorias': []})

@api_view(['GET'])
def nota_saude(request):
    prompt = (
        "Analise todos os dados financeiros do banco de dados e responda apenas com um número de 0 a 100, representando a nota de saúde financeira da empresa. Não escreva mais nada além do número."
    )
    resposta = analisar_financeiro_llm(prompt)
    try:
        nota = int(float(resposta.strip()))
        if nota < 0: nota = 0
        if nota > 100: nota = 100
    except:
        nota = 0
    return Response({'nota': nota})
