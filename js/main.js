/**
 * Main entry point for the Cofre Explosivo game
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação antes de inicializar o jogo
    checkAuthentication();
});

/**
 * Verifica se o usuário está autenticado
 */
function checkAuthentication() {
    // Código fixo para acesso: 1234
    const fixedToken = '1234';
    
    // Verificar se há um token na URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Validar o token com o servidor
        validateTokenWithServer(token);
    } else {
        // Verificar se há um token na sessão
        const sessionToken = sessionStorage.getItem('accessToken');
        if (sessionToken) {
            validateTokenWithServer(sessionToken);
        } else {
            // Usar o token fixo e inicializar o jogo diretamente
            sessionStorage.setItem('accessToken', fixedToken);
            initializeGame();
        }
    }
}

/**
 * Valida o token com o servidor
 * @param {string} token - Token a ser validado
 */
function validateTokenWithServer(token) {
    // Se o token for 1234, validar diretamente
    if (token === '1234') {
        sessionStorage.setItem('accessToken', token);
        
        // Limpar o token da URL para não ficar exposto
        if (window.location.search) {
            const cleanUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, cleanUrl);
        }
        
        initializeGame();
        return;
    }
    
    // Para outros tokens, validar com o servidor
    fetch(`/api/tokens?action=validate&token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                // Token válido, armazenar na sessão e inicializar o jogo
                sessionStorage.setItem('accessToken', token);
                
                // Limpar o token da URL para não ficar exposto
                if (window.location.search) {
                    const cleanUrl = window.location.href.split('?')[0];
                    window.history.replaceState({}, document.title, cleanUrl);
                }
                
                initializeGame();
            } else {
                // Usar o token fixo e inicializar o jogo diretamente
                sessionStorage.setItem('accessToken', '1234');
                initializeGame();
            }
        })
        .catch(error => {
            console.error('Erro ao validar token:', error);
            // Em caso de erro, usar o token fixo e inicializar o jogo
            sessionStorage.setItem('accessToken', '1234');
            initializeGame();
        });
}

/**
 * Mostra a tela de login
 */
function showLoginScreen() {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostra a tela de login
    document.getElementById('login-screen').classList.remove('hidden');
    
    // Adiciona eventos aos botões da tela de login
    setupLoginScreenEvents();
}

/**
 * Configura os eventos da tela de login
 */
function setupLoginScreenEvents() {
    // Botão de acesso administrativo
    document.getElementById('admin-login-button').addEventListener('click', () => {
        showAdminLoginPrompt();
    });
}

/**
 * Mostra um prompt para login administrativo
 */
function showAdminLoginPrompt() {
    const password = prompt('Digite a senha de administrador:');
    
    // Senha padrão: 1234
    if (password === '1234') {
        showAdminScreen();
    } else {
        alert('Senha incorreta!');
    }
}

/**
 * Mostra a tela de administração
 */
function showAdminScreen() {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostra a tela de administração
    document.getElementById('admin-screen').classList.remove('hidden');
    
    // Configura os eventos da tela de administração
    setupAdminScreenEvents();
    
    // Atualiza a lista de tokens ativos
    updateActiveTokensList();
}

/**
 * Configura os eventos da tela de administração
 */
function setupAdminScreenEvents() {
    // Botão para gerar link de convite
    document.getElementById('generate-invite-button').addEventListener('click', () => {
        generateInviteLink();
    });
    
    // Botão para copiar link de convite
    document.getElementById('copy-invite-button').addEventListener('click', () => {
        copyInviteLink();
    });
    
    // Botão para voltar
    document.getElementById('back-from-admin-button').addEventListener('click', () => {
        showLoginScreen();
    });
}

/**
 * Gera um novo link de convite
 */
function generateInviteLink() {
    const labelInput = document.getElementById('invite-label');
    const label = labelInput.value.trim() || 'convidado';
    
    // Fazer requisição para o servidor para gerar o token
    fetch(`/api/tokens?action=create&label=${encodeURIComponent(label)}`, {
        headers: {
            'Authorization': 'Bearer 1234'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Exibe o resultado
                const inviteUrl = `${window.location.origin}?token=${data.token}`;
                document.getElementById('invite-url').value = inviteUrl;
                document.getElementById('invite-result').classList.remove('hidden');
                
                // Atualiza a lista de tokens ativos
                updateActiveTokensList();
                
                // Limpa o campo de entrada
                labelInput.value = '';
            } else {
                alert('Erro ao gerar link de convite.');
            }
        })
        .catch(error => {
            console.error('Erro ao gerar token:', error);
            alert('Erro ao gerar link de convite. Verifique o console para mais detalhes.');
        });
}

/**
 * Copia o link de convite para a área de transferência
 */
function copyInviteLink() {
    const inviteUrl = document.getElementById('invite-url');
    inviteUrl.select();
    document.execCommand('copy');
    
    // Feedback visual
    const copyButton = document.getElementById('copy-invite-button');
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copiado!';
    setTimeout(() => {
        copyButton.textContent = originalText;
    }, 2000);
}

/**
 * Atualiza a lista de tokens ativos
 */
function updateActiveTokensList() {
    const tokensList = document.getElementById('active-tokens-list');
    tokensList.innerHTML = '<p>Carregando...</p>';
    
    // Fazer requisição para o servidor para listar os tokens
    fetch('/api/tokens?action=list', {
        headers: {
            'Authorization': 'Bearer 1234'
        }
    })
        .then(response => response.json())
        .then(tokens => {
            if (tokens.length === 0) {
                tokensList.innerHTML = '<p>Nenhum link de convite ativo.</p>';
                return;
            }
            
            let html = '<table class="tokens-table">';
            html += '<tr><th>Convidado</th><th>Código</th><th>Criado em</th><th>Último uso</th><th>Ações</th></tr>';
            
            tokens.forEach(token => {
                const createdDate = new Date(token.createdAt).toLocaleString();
                const lastUsedDate = token.lastUsed ? new Date(token.lastUsed).toLocaleString() : 'Nunca';
                
                html += `
                    <tr>
                        <td>${token.label}</td>
                        <td>${token.token}</td>
                        <td>${createdDate}</td>
                        <td>${lastUsedDate}</td>
                        <td>
                            <button class="revoke-token-button" data-token="${token.token}">Revogar</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</table>';
            tokensList.innerHTML = html;
            
            // Adiciona eventos aos botões de revogação
            document.querySelectorAll('.revoke-token-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const token = event.target.getAttribute('data-token');
                    revokeToken(token);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao listar tokens:', error);
            tokensList.innerHTML = '<p>Erro ao carregar tokens. Verifique o console para mais detalhes.</p>';
        });
}

/**
 * Revoga um token específico
 * @param {string} token - Token a ser revogado
 */
function revokeToken(token) {
    if (confirm('Tem certeza que deseja revogar este link de convite?')) {
        // Fazer requisição para o servidor para revogar o token
        fetch(`/api/tokens?action=revoke&token=${token}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer 1234'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Link de convite revogado com sucesso!');
                    updateActiveTokensList();
                } else {
                    alert('Erro ao revogar o link de convite.');
                }
            })
            .catch(error => {
                console.error('Erro ao revogar token:', error);
                alert('Erro ao revogar o link de convite. Verifique o console para mais detalhes.');
            });
    }
}

/**
 * Inicializa o jogo
 */
function initializeGame() {
    // Initialize game state
    const gameState = new GameState();
    
    // Initialize game UI
    const gameUI = new GameUI(gameState);
    
    // Log initialization
    console.log('Cofre Explosivo inicializado');
}
