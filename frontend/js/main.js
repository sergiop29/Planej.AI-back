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