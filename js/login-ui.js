/**
 * Gerencia a interface de usuário para login e controle de acesso
 */
class LoginUI {
    constructor() {
        this.initializeLoginScreen();
        this.initializeAdminScreen();
    }

    /**
     * Inicializa a tela de login
     */
    initializeLoginScreen() {
        // Cria a tela de login se ela não existir
        if (!document.getElementById('login-screen')) {
            const loginScreen = document.createElement('div');
            loginScreen.id = 'login-screen';
            loginScreen.className = 'screen';
            
            loginScreen.innerHTML = `
                <div class="login-content">
                    <h1>Cofre Explosivo</h1>
                    <div class="login-message">
                        <p>Acesso restrito</p>
                        <p>Este jogo só pode ser acessado através de um link de convite válido.</p>
                    </div>
                    <div class="login-form">
                        <p>Se você é o administrador, pode gerar novos links de convite:</p>
                        <button id="admin-login-button" class="menu-button">Acesso Administrativo</button>
                    </div>
                </div>
            `;
            
            document.querySelector('.game-container').appendChild(loginScreen);
            
            // Adiciona evento ao botão de acesso administrativo
            document.getElementById('admin-login-button').addEventListener('click', () => {
                this.showAdminLoginPrompt();
            });
        }
    }

    /**
     * Inicializa a tela de administração
     */
    initializeAdminScreen() {
        // Cria a tela de administração se ela não existir
        if (!document.getElementById('admin-screen')) {
            const adminScreen = document.createElement('div');
            adminScreen.id = 'admin-screen';
            adminScreen.className = 'screen hidden';
            
            adminScreen.innerHTML = `
                <div class="admin-content">
                    <h1>Painel Administrativo</h1>
                    <div class="admin-section">
                        <h2>Gerar Novo Link de Convite</h2>
                        <div class="admin-form">
                            <input type="text" id="invite-label" placeholder="Nome do convidado" class="admin-input">
                            <button id="generate-invite-button" class="admin-button">Gerar Link</button>
                        </div>
                        <div id="invite-result" class="invite-result hidden">
                            <p>Link de convite gerado:</p>
                            <div class="invite-url-container">
                                <input type="text" id="invite-url" readonly class="invite-url">
                                <button id="copy-invite-button" class="admin-button">Copiar</button>
                            </div>
                        </div>
                    </div>
                    <div class="admin-section">
                        <h2>Links de Convite Ativos</h2>
                        <div id="active-tokens-list" class="active-tokens-list">
                            <p>Carregando...</p>
                        </div>
                    </div>
                    <button id="back-from-admin-button" class="menu-button">Voltar</button>
                </div>
            `;
            
            document.querySelector('.game-container').appendChild(adminScreen);
            
            // Adiciona eventos aos botões
            document.getElementById('generate-invite-button').addEventListener('click', () => {
                this.generateInviteLink();
            });
            
            document.getElementById('copy-invite-button').addEventListener('click', () => {
                this.copyInviteLink();
            });
            
            document.getElementById('back-from-admin-button').addEventListener('click', () => {
                this.showLoginScreen();
            });
        }
    }

    /**
     * Mostra a tela de login
     */
    showLoginScreen() {
        // Esconde todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostra a tela de login
        document.getElementById('login-screen').classList.remove('hidden');
    }

    /**
     * Mostra a tela de administração
     */
    showAdminScreen() {
        // Esconde todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostra a tela de administração
        document.getElementById('admin-screen').classList.remove('hidden');
        
        // Atualiza a lista de tokens ativos
        this.updateActiveTokensList();
    }

    /**
     * Mostra um prompt para login administrativo
     */
    showAdminLoginPrompt() {
        const password = prompt('Digite a senha de administrador:');
        
        // Senha padrão: 1234
        if (password === '1234') {
            this.showAdminScreen();
        } else {
            alert('Senha incorreta!');
        }
    }

    /**
     * Gera um novo link de convite
     */
    generateInviteLink() {
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
                    this.updateActiveTokensList();
                    
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
    copyInviteLink() {
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
    updateActiveTokensList() {
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
                        this.revokeToken(token);
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
    revokeToken(token) {
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
                        this.updateActiveTokensList();
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
}

// Instância global da interface de login
const loginUI = new LoginUI();
