// Funções utilitárias para o mockup
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar tema
  initTheme();
  
  // Toggle de senha nos formulários
  const passwordToggles = document.querySelectorAll('.password-toggle');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordField = this.previousElementSibling;
      const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordField.setAttribute('type', type);
      this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  });

  // Toggle do menu mobile
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      navLinks.classList.toggle('active');
    });
  }

  // Toggle do perfil dropdown
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', function(e) {
      e.stopPropagation();
      const profileDropdown = document.querySelector('.profile-dropdown');
      if (profileDropdown) {
        profileDropdown.classList.toggle('active');
      }
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function() {
      const profileDropdown = document.querySelector('.profile-dropdown');
      if (profileDropdown && profileDropdown.classList.contains('active')) {
        profileDropdown.classList.remove('active');
      }
    });
  }

  // Toggle do tema (claro/escuro)
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      toggleTheme();
    });
  }

  // Toggle dos itens de FAQ
  const faqItems = document.querySelectorAll('.faq-question');
  faqItems.forEach(item => {
    item.addEventListener('click', function() {
      const parent = this.parentElement;
      parent.classList.toggle('active');
    });
  });

  // Funções para modais
  const modalTriggers = document.querySelectorAll('[data-modal]');
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  const modalCloses = document.querySelectorAll('.modal-close');
  modalCloses.forEach(close => {
    close.addEventListener('click', function() {
      const modal = this.closest('.modal');
      modal.classList.remove('active');
    });
  });

  // Fechar modal ao clicar fora
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('active');
    }
  });

  // Inicializar gráficos se existirem
  initCharts();
  
  // Inicializar animação de contagem nos valores estatísticos
  initCountAnimation();
});




// Função para inicializar o tema
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Atualizar ícone do toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = savedTheme === 'dark' 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  }
}

// Função para alternar entre temas claro e escuro
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Atualizar ícone do toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = newTheme === 'dark' 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  }
}




// Função para animar contagem de números
function initCountAnimation() {
  const statValues = document.querySelectorAll('.stat-value');
  
  statValues.forEach(statValue => {
    // Obter o valor final do elemento
    const finalValue = statValue.textContent;
    
    // Verificar se o valor contém moeda (R$)
    const hasCurrency = finalValue.includes('R$');
    
    // Remover formatação para obter apenas o número
    let rawValue = finalValue.replace(/[^\d,.-]/g, '');
    // Substituir vírgula por ponto para cálculos
    rawValue = rawValue.replace(',', '.');
    
    // Converter para número
    const targetValue = parseFloat(rawValue);
    
    // Definir valor inicial como 0
    let startValue = 0;
    
    // Verificar se é um valor percentual
    const isPercent = finalValue.includes('%');
    
    // Formatar o valor inicial
    if (hasCurrency) {
      statValue.textContent = 'R$ 0,00';
    } else if (isPercent) {
      statValue.textContent = '0%';
    } else {
      statValue.textContent = '0';
    }
    
    // Função para formatar números com separador de milhares e decimais
    function formatNumber(number) {
      return number.toLocaleString('pt-BR', {
        minimumFractionDigits: hasCurrency ? 2 : 0,
        maximumFractionDigits: hasCurrency ? 2 : 0
      });
    }
    
    // Calcular a duração da animação com base no valor final
    // Valores maiores terão animações um pouco mais longas
    const duration = Math.min(2000, 1000 + Math.log(targetValue) * 200);
    
    // Calcular o incremento por frame
    const framesPerSecond = 60;
    const totalFrames = duration / 1000 * framesPerSecond;
    const increment = targetValue / totalFrames;
    
    // Iniciar a animação
    let currentValue = 0;
    let frame = 0;
    
    function animate() {
      frame++;
      currentValue += increment;
      
      // Garantir que não ultrapasse o valor final
      if (currentValue > targetValue) {
        currentValue = targetValue;
      }
      
      // Atualizar o texto com o valor formatado
      if (hasCurrency) {
        statValue.textContent = 'R$ ' + formatNumber(currentValue);
      } else if (isPercent) {
        statValue.textContent = Math.round(currentValue) + '%';
      } else {
        statValue.textContent = formatNumber(currentValue);
      }
      
      // Continuar a animação até atingir o valor final
      if (currentValue < targetValue) {
        requestAnimationFrame(animate);
      } else {
        // Restaurar o texto original para garantir a formatação exata
        statValue.textContent = finalValue;
      }
    }
    
    // Iniciar a animação com um pequeno atraso para cada elemento
    setTimeout(() => {
      animate();
    }, 300);
  });
}




// Função para inicializar gráficos
function initCharts() {
  // Verificar se o elemento de gráfico existe
  const revenueChart = document.getElementById('revenueChart');
  if (revenueChart) {
    // Não inicializar gráfico de receitas/despesas aqui, pois é feito dinamicamente no dashboard.html
  }

  // Gráfico de fluxo de caixa
  // (Removido código mock para garantir uso apenas de dados reais no dashboard)
  
  // Gráfico de previsão
  const forecastChart = document.getElementById('forecastChart');
  if (forecastChart) {
    // Dados fictícios para o gráfico de previsão
    const forecastData = {
      labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      datasets: [
        {
          label: 'Entradas Previstas',
          data: [15000, 18000, 12000, 13500],
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--success-color'),
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--success-color') + '20',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Saídas Previstas',
          data: [9000, 12000, 8000, 6200],
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--warning-color'),
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--warning-color') + '20',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Saldo Projetado',
          data: [6000, 6000, 4000, 7300],
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        }
      ]
    };

    // Configuração do gráfico
    new Chart(forecastChart, {
      type: 'line',
      data: forecastData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R$ ' + context.raw.toLocaleString('pt-BR');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              },
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
            }
          }
        }
      }
    });
  }
}
//----------------------------------------


// Função para simular login
function simulateLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (email && password) {
    window.location.href = 'dashboard.html';
  } else {
    alert('Por favor, preencha todos os campos.');
  }
}

// Função para simular cadastro
function simulateSignup(event) {
  event.preventDefault();
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (firstName && lastName && email && password) {
    window.location.href = 'dashboard.html';
  } else {
    alert('Por favor, preencha todos os campos.');
  }
}

// Função para simular recuperação de senha
function simulatePasswordReset(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  
  if (email) {
    alert('Um link de recuperação foi enviado para o seu e-mail.');
    window.location.href = 'login.html';
  } else {
    alert('Por favor, informe seu e-mail.');
  }
}

// Função para simular edição de item financeiro
function simulateFinancialItemEdit(event) {
  event.preventDefault();
  const name = document.getElementById('itemName').value;
  const amount = document.getElementById('itemAmount').value;
  const date = document.getElementById('itemDate').value;
  
  if (name && amount && date) {
    alert('Item financeiro atualizado com sucesso!');
    const modal = document.querySelector('.modal.active');
    if (modal) {
      modal.classList.remove('active');
    }
    // Aqui poderia atualizar a interface com os novos dados
  } else {
    alert('Por favor, preencha todos os campos.');
  }
}

// Função para alternar entre planos
function selectPlan(planId) {
  const plans = document.querySelectorAll('.pricing-card');
  plans.forEach(plan => {
    plan.classList.remove('featured');
  });
  
  const selectedPlan = document.getElementById(planId);
  if (selectedPlan) {
    selectedPlan.classList.add('featured');
  }
}



//----------------------------------------
// Função para simular interação com o agente
function simulateAgentInteraction(message) {
  const agentResponseElement = document.getElementById('agentResponse');
  if (agentResponseElement) {
    // Respostas fictícias do agente
    const responses = [
      "Analisando seus dados financeiros, recomendo reduzir despesas com marketing em 15% nos próximos 3 meses.",
      "Seus indicadores de fluxo de caixa mostram uma tendência positiva. Continue com a estratégia atual.",
      "Atenção! Identifiquei um padrão de atraso nos recebimentos que pode comprometer sua liquidez.",
      "Baseado na sazonalidade do seu negócio, sugiro aumentar o estoque em 20% para o próximo trimestre."
    ];
    
    // Mostrar indicador de digitação
    agentResponseElement.innerHTML = '<span class="typing-indicator"><span>.</span><span>.</span><span>.</span></span>';
    
    // Simular tempo de resposta
    setTimeout(() => {
      // Seleciona uma resposta aleatória
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      agentResponseElement.textContent = randomResponse;
      
      // Exibe a seção de resposta do agente
      const agentResponseSection = document.querySelector('.agent-message');
      if (agentResponseSection) {
        agentResponseSection.style.display = 'block';
      }
    }, 1500);
  }
}

// Função para adicionar mensagem no chat do agente
function addChatMessage(message, isUser = false, isLoading = false) {
  const chatMessages = document.querySelector('.chat-messages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isUser ? 'outgoing' : 'incoming'}`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = `chat-message-avatar ${isUser ? 'user' : 'agent'}`;
  avatarDiv.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'chat-message-content';
  if (isLoading) {
    // Animação de pontos pulsando
    contentDiv.innerHTML = `
      <span class="typing-indicator-loading">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    `}}

// Função utilitária global para carregar gráfico de fluxo de caixa
window.carregarGraficoFluxoCaixaGlobal = async function(canvasId, anoSelecionado) {
    try {
        const resp = await fetch('http://127.0.0.1:8000/users/cash-flow/');
        const data = await resp.json();
        // Filtrar por ano
        const ano = anoSelecionado || (data.labels.length > 0 ? data.labels[data.labels.length-1].slice(0,4) : '2025');
        const indices = data.labels.map((label, i) => label.startsWith(ano) ? i : -1).filter(i => i !== -1);
        const labelsFiltrados = indices.map(i => data.labels[i]);
        const fluxoFiltrado = indices.map(i => data.fluxo_caixa[i]);
        // Converter YYYY-MM para nome do mês
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const labelsMeses = labelsFiltrados.map(l => meses[parseInt(l.slice(5,7), 10)-1]);
        // Definir cor de cada barra
        const verde = getComputedStyle(document.documentElement).getPropertyValue('--success-color');
        const vermelho = getComputedStyle(document.documentElement).getPropertyValue('--warning-color');
        const cores = fluxoFiltrado.map(v => v < 0 ? vermelho : verde);
        // Destruir gráfico anterior se existir
        if(window[canvasId + 'Instance']) window[canvasId + 'Instance'].destroy();
        const ctx = document.getElementById(canvasId).getContext('2d');
        window[canvasId + 'Instance'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsMeses,
                datasets: [{
                    label: 'Fluxo de Caixa',
                    data: fluxoFiltrado,
                    backgroundColor: cores,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        // Em caso de erro, não mostra nada
    }
}

// Função para exibir gráfico de ponto de equilíbrio contábil por unidades vendidas
window.carregarGraficoBreakEven = async function(canvasId) {
    try {
        // Buscar todas as receitas (vendas) do banco
        const resp = await fetch('http://127.0.0.1:8000/users/financial-records/');
        const data = await resp.json();
        // Filtrar apenas receitas
        const vendas = data.filter(r => r['Tipo'] && r['Tipo'].toLowerCase() === 'receita');
        // Eixo X: unidades vendidas (1, 2, 3, ...)
        const unidades = vendas.map((_, i) => i + 1);
        // Receita acumulada
        let receitaAcumulada = 0;
        const receitas = vendas.map(v => {
            const valor = parseFloat(String(v['Valor (R$)']).replace('.', '').replace(',', '.')) || 0;
            receitaAcumulada += valor;
            return receitaAcumulada;
        });
        // Buscar custos totais (fixos + variáveis) da API de indicadores financeiros
        const respIndicadores = await fetch('http://127.0.0.1:8000/users/financial-indicators/');
        const indicadores = await respIndicadores.json();
        const custoTotal = indicadores.gastos || 0;
        const custosTotais = unidades.map(() => custoTotal);
        // Encontrar o ponto de equilíbrio (primeira unidade onde receita acumulada >= custo total)
        let breakEvenIndex = receitas.findIndex(r => r >= custoTotal);
        let breakEvenX = breakEvenIndex !== -1 ? breakEvenIndex : null;
        let breakEvenY = breakEvenIndex !== -1 ? receitas[breakEvenIndex] : null;
        // Destruir gráfico anterior se existir
        if(window[canvasId + 'Instance']) window[canvasId + 'Instance'].destroy();
        const ctx = document.getElementById(canvasId).getContext('2d');
        window[canvasId + 'Instance'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: unidades, // apenas o número da unidade, mas não será exibido
                datasets: [
                    {
                        label: 'Receita Acumulada',
                        data: receitas,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--success-color'),
                        backgroundColor: 'transparent',
                        tension: 0.1,
                        pointRadius: 2
                    },
                    {
                        label: 'Custo Total',
                        data: custosTotais,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--warning-color'),
                        backgroundColor: 'transparent',
                        borderDash: [5,5],
                        tension: 0.1,
                        pointRadius: 0
                    },
                    // Adiciona o ponto de equilíbrio apenas se existir
                    ...(breakEvenIndex !== -1 ? [{
                        label: 'Ponto de Equilíbrio',
                        data: unidades.map((u, i) => (i === breakEvenIndex ? breakEvenY : null)),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                        pointRadius: 7,
                        type: 'scatter',
                        showLine: false,
                        order: 3
                    }] : [])
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if(context.dataset.label === 'Ponto de Equilíbrio') {
                                    return 'Ponto de Equilíbrio: ' + (breakEvenIndex+1) + ' unidades';
                                }
                                return context.dataset.label + ': R$ ' + context.raw.toLocaleString('pt-BR');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Unidades Vendidas'
                        },
                        ticks: {
                            callback: function() { return ''; }
                        }
                    }
                }
            }
        });
    } catch (err) {
        // Em caso de erro, não mostra nada
    }
}

async function atualizarIndiceSaudeFinanceira() {
  try {
    // Aqui você pode customizar a pergunta para o agente de IA
    const pergunta = 'Analise meus dados financeiros e me dê um índice de saúde financeira (de 0 a 100), um rótulo (ex: Bom, Ruim, Excelente), um texto explicativo, uma lista de pontos fortes e uma lista de áreas de melhoria.';
    const resp = await fetch('http://127.0.0.1:8000/users/financial-agent/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: pergunta })
    });
    const data = await resp.json();
    // Espera-se que a resposta do agente seja um JSON estruturado. Se vier texto, tente fazer o parse.
    let resultado = {};
    try {
      resultado = typeof data.resposta === 'string' ? JSON.parse(data.resposta) : data.resposta;
    } catch {
      // Se não for JSON, apenas mostra o texto na análise
      resultado = { analise: data.resposta };
    }
    // Atualizar valores na tela
    if (resultado.indice !== undefined) {
      document.getElementById('indice-saude-valor').textContent = resultado.indice;
    }
    if (resultado.label) {
      document.getElementById('indice-saude-label').textContent = resultado.label;
    }
    if (resultado.analise) {
      document.getElementById('indice-saude-analise').textContent = resultado.analise;
    }
    if (Array.isArray(resultado.pontos_fortes)) {
      document.getElementById('indice-saude-pontos-fortes').innerHTML = resultado.pontos_fortes.map(p => `<li style='margin-bottom:5px;'>${p}</li>`).join('');
    }
    if (Array.isArray(resultado.melhorias)) {
      document.getElementById('indice-saude-melhorias').innerHTML = resultado.melhorias.map(m => `<li style='margin-bottom:5px;'>${m}</li>`).join('');
    }
  } catch (err) {
    document.getElementById('indice-saude-analise').textContent = 'Não foi possível obter a análise da IA.';
  }
}