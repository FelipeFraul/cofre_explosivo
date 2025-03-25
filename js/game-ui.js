/**
 * GameUI class - Manages the game user interface
 */
class GameUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.volumeDial = null;
        this._isSettingUpGameScreen = false;
        this.initializeScreens();
        this.initializeButtons();
        this.initializeBetOptions();
        this.updateBalanceDisplay();
        
        // Carregar recursos do jogo
        this.loadGameResources();
    }

    /**
     * Inicializa as referências para as telas do jogo
     */
    initializeScreens() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            instructions: document.getElementById('instructions-screen'),
            records: document.getElementById('records-screen'),
            startGame: document.getElementById('start-game-screen'),
            countdown: document.getElementById('countdown-screen'),
            game: document.getElementById('game-screen'),
            phaseTransition: document.getElementById('phase-transition-screen'),
            explosiveBooster: document.getElementById('explosive-booster-screen'),
            result: document.getElementById('result-screen')
        };
    }

    /**
     * Inicializa os botões da interface
     */
    initializeButtons() {
        // Botões do menu principal
        document.getElementById('start-button').addEventListener('click', () => this.showScreen('startGame'));
        document.getElementById('instructions-button').addEventListener('click', () => this.showScreen('instructions'));
        document.getElementById('records-button').addEventListener('click', () => this.showScreen('records'));

        // Botões de voltar
        document.getElementById('back-from-instructions-button').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('back-from-records-button').addEventListener('click', () => this.showScreen('menu'));

        // Botões de jogo
        document.getElementById('play-button').addEventListener('click', () => this.startGame());
        document.getElementById('confirm-value').addEventListener('click', () => this.confirmValue());
        document.getElementById('clear-value').addEventListener('click', () => this.clearValue());

        // Botões do booster explosivo
        document.getElementById('stop-button').addEventListener('click', () => this.processExplosiveBoosterResult(false));
        document.getElementById('continue-button').addEventListener('click', () => this.processExplosiveBoosterResult(true));

        // Botão de jogar novamente
        document.getElementById('play-again-button').addEventListener('click', () => this.resetAndStartNewGame());
    }

    /**
     * Inicializa as opções de aposta
     */
    initializeBetOptions() {
        const betOptionsContainer = document.getElementById('bet-options');
        betOptionsContainer.innerHTML = '';

        GameConfig.betOptions.forEach(bet => {
            const betOption = document.createElement('div');
            betOption.classList.add('bet-option');
            betOption.textContent = `${bet.toFixed(2)}`;
            betOption.addEventListener('click', () => this.selectBet(bet));
            betOptionsContainer.appendChild(betOption);
        });

        this.selectedBet = null;
        document.getElementById('play-button').disabled = true;
    }

    /**
     * Seleciona uma aposta
     * @param {number} bet - Valor da aposta
     */
    selectBet(bet) {
        // Remove a classe 'selected' de todas as opções
        document.querySelectorAll('.bet-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Adiciona a classe 'selected' à opção clicada
        const selectedOption = Array.from(document.querySelectorAll('.bet-option')).find(option => 
            option.textContent === `${bet.toFixed(2)}`
        );
        
        if (selectedOption) {
            selectedOption.classList.add('selected');
            this.selectedBet = bet;
            this.gameState.setBet(bet);
            document.getElementById('play-button').disabled = false;
        }
    }

    /**
     * Atualiza o display do saldo
     */
    updateBalanceDisplay() {
        // Atualiza o saldo na tela do menu principal
        const menuBalanceDisplay = document.getElementById('menu-balance-display');
        if (menuBalanceDisplay) {
            menuBalanceDisplay.textContent = `${this.gameState.playerBalance.toFixed(2)}`;
        }
        
        // Atualiza o saldo na tela de início de jogo
        const startGameBalanceDisplay = document.getElementById('start-game-balance-display');
        if (startGameBalanceDisplay) {
            startGameBalanceDisplay.textContent = `${this.gameState.playerBalance.toFixed(2)}`;
        }
        
        // Atualiza o saldo na tela de jogo
        const gameBalanceDisplay = document.getElementById('game-balance-display');
        if (gameBalanceDisplay) {
            gameBalanceDisplay.textContent = `${this.gameState.playerBalance.toFixed(2)}`;
        }
    }

    /**
     * Mostra uma tela específica e esconde as outras
     * @param {string} screenName - Nome da tela a ser mostrada
     */
    showScreen(screenName) {
        // Esconde todas as telas
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostra a tela solicitada
        this.screens[screenName].classList.remove('hidden');
        
        // Controle da música de fundo
        if (screenName === 'loading' || screenName === 'menu' || screenName === 'instructions' || 
            screenName === 'records' || screenName === 'startGame') {
            // Iniciar música de fundo nas telas de menu/login
            if (window.audioManager) {
                window.audioManager.playBackgroundMusic();
            }
        } else if (screenName === 'game' || screenName === 'countdown' || 
                  screenName === 'phaseTransition' || screenName === 'explosiveBooster' || 
                  screenName === 'result') {
            // Parar música de fundo nas telas de jogo
            if (window.audioManager) {
                window.audioManager.stopBackgroundMusic();
            }
        }
        
        // Ações específicas para cada tela
        if (screenName === 'startGame') {
            this.updateBalanceDisplay();
        } else if (screenName === 'game' && !this._isSettingUpGameScreen) {
            // Adicionamos uma flag para evitar recursão infinita
            this._isSettingUpGameScreen = true;
            this.setupGameScreen();
            this._isSettingUpGameScreen = false;
        }
    }

    /**
     * Inicia o jogo
     */
    startGame() {
        try {
            // Obtém o valor da aposta selecionada
            const betValue = this.gameState.playerBet;
            
            // Inicia o jogo no estado
            if (!this.gameState.startGame(betValue)) {
                alert('Saldo insuficiente para esta aposta!');
                return;
            }
            
            // Atualiza o display do saldo após a aposta ser feita
            this.updateBalanceDisplay();
            
            // Limpa os efeitos visuais de tempo
            this.clearTimeEffects();
            
            // Mostra a tela de contagem regressiva com o booster
            this.showBoosterAndCountdown();
        } catch (error) {
            console.error("Erro ao iniciar o jogo:", error);
            // Fallback para mostrar o menu em caso de erro
            this.showScreen('menu');
        }
    }

    /**
     * Mostra o booster e inicia a contagem regressiva
     */
    showBoosterAndCountdown() {
        try {
            // Mostra a tela de contagem regressiva
            this.showScreen('countdown');
            
            // Atualiza o número da fase
            if (this.gameState.currentPhase === 3) {
                document.getElementById('countdown-phase').textContent = "Final";
            } else if (this.gameState.isExplosiveBoosterPhase) {
                document.getElementById('countdown-phase').textContent = "Booster Explosivo";
            } else {
                document.getElementById('countdown-phase').textContent = this.gameState.currentPhase;
            }
            
            // Exibe uma mensagem de incentivo para a fase atual
            let messageCategory;
            if (this.gameState.isExplosiveBoosterPhase) {
                messageCategory = 'explosiveBoosterPrompt';
            } else {
                messageCategory = `phase${this.gameState.currentPhase}Win`;
            }
            const message = GameMessages.getRandomMessage(messageCategory);
            document.getElementById('countdown-message').innerHTML = message.replace('\n', '<br>');
            
            // Exibe o booster atual com a cor correta
            const boosterElement = document.getElementById('countdown-booster');
            if (boosterElement) {
                if (this.gameState.isExplosiveBoosterPhase) {
                    boosterElement.textContent = `${this.gameState.explosiveBooster.value}X`;
                    boosterElement.style.color = this.gameState.explosiveBooster.color;
                } else {
                    boosterElement.textContent = `${this.gameState.currentBooster.value}X`;
                    boosterElement.style.color = this.gameState.currentBooster.color;
                }
            }
            
            // Inicia a contagem regressiva
            let countdown = 5;
            
            // Atualiza a contagem regressiva a cada segundo
            const countdownInterval = setInterval(() => {
                countdown--;
                
                // Reproduz o som de contagem regressiva
                if (window.audioManager && countdown > 0) {
                    window.audioManager.playSound('countdown', 0.7);
                }
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    // Usamos setTimeout para garantir que a UI seja atualizada antes de configurar a tela de jogo
                    setTimeout(() => {
                        // Mostra a tela de jogo diretamente em vez de chamar setupGameScreen
                        this.showScreen('game');
                    }, 100);
                }
            }, 1000);
        } catch (error) {
            console.error("Erro na contagem regressiva:", error);
            // Em caso de erro, vamos diretamente para a tela de jogo
            this.showScreen('game');
        }
    }

    /**
     * Configura a tela de jogo
     */
    setupGameScreen() {
        try {
            // Limpa qualquer mensagem anterior
            this.clearMessage();
            
            // Verifica se está na fase do booster explosivo
            if (this.gameState.isExplosiveBoosterPhase) {
                // Atualiza o número da fase
                document.getElementById('phase-number').textContent = "Booster Explosivo";
                
                // Limpa a descrição da fase para o booster explosivo
                document.getElementById('phase-description').textContent = "";
                
                // Calcula e exibe o valor acumulado (valor base) e o potencial valor com o booster explosivo
                const baseValue = this.gameState.calculateCurrentPrize();
                document.getElementById('current-value').textContent = baseValue.toFixed(2);
                
                // Exibe o booster explosivo com a cor correta
                const boosterElement = document.getElementById('booster-indicator');
                if (boosterElement) {
                    boosterElement.textContent = `${this.gameState.explosiveBooster.value}X`;
                    boosterElement.style.color = this.gameState.explosiveBooster.color;
                }
            } else {
                // Atualiza o número da fase
                if (this.gameState.currentPhase === 3) {
                    document.getElementById('phase-number').textContent = "Final";
                } else {
                    document.getElementById('phase-number').textContent = this.gameState.currentPhase;
                }
                
                // Atualiza a descrição da fase
                if (this.gameState.currentPhase === 1) {
                    document.getElementById('phase-description').textContent = "0 a 9";
                } else if (this.gameState.currentPhase === 2) {
                    document.getElementById('phase-description').textContent = "0 a 6";
                } else if (this.gameState.currentPhase === 3) {
                    document.getElementById('phase-description').textContent = "0 a 4";
                }
                
                // Calcula e exibe o valor atual
                const currentPrize = this.gameState.calculateCurrentPrize();
                document.getElementById('current-value').textContent = currentPrize.toFixed(2);
                
                // Exibe o booster atual com a cor correta
                const boosterElement = document.getElementById('booster-indicator');
                if (boosterElement) {
                    boosterElement.textContent = `${this.gameState.currentBooster.value}X`;
                    boosterElement.style.color = this.gameState.currentBooster.color;
                }
            }
            
            // Inicializa o dial
            this.initializeVolumeDial();
            
            // Inicia o timer
            this.startTimer();
        } catch (error) {
            console.error("Erro ao inicializar a tela de jogo:", error);
        }
    }

    /**
     * Inicializa o dial de volume
     */
    initializeVolumeDial() {
        try {
            // Usa o método setupDialForPhase para configurar o dial
            this.setupDialForPhase();
        } catch (error) {
            console.error("Erro ao inicializar o dial de volume:", error);
        }
    }

    /**
     * Inicia o timer da fase
     */
    startTimer() {
        try {
            // Obtém a configuração da fase atual
            let phase;
            
            if (this.gameState.isExplosiveBoosterPhase) {
                // Se estamos na fase do booster explosivo, use a configuração específica
                phase = GameConfig.explosivePhase;
            } else {
                // Caso contrário, use a fase atual
                phase = GameConfig.phases.find(p => p.number === this.gameState.currentPhase);
            }
            
            if (!phase) {
                console.error(`Fase não encontrada para timer: ${this.gameState.currentPhase}`);
                return;
            }
            
            let timeLeft = phase.time;
            document.getElementById('timer').textContent = timeLeft;
            
            // Limpa o intervalo anterior, se existir
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            // Referência ao elemento game-screen para aplicar os efeitos
            const gameScreen = document.getElementById('game-screen');
            
            // Remove qualquer classe de efeito existente
            gameScreen.classList.remove('time-warning', 'time-danger');
            
            console.log("Timer iniciado com", timeLeft, "segundos");
            
            this.timerInterval = setInterval(() => {
                timeLeft--;
                document.getElementById('timer').textContent = timeLeft;
                console.log("Tempo restante:", timeLeft, "segundos");
                
                this.applyTimeEffect(timeLeft);
                
                if (timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    // Remove os efeitos visuais
                    gameScreen.classList.remove('time-warning', 'time-danger');
                    document.body.style.backgroundColor = "";
                    this.endGameTimeout();
                }
            }, 1000);
        } catch (error) {
            console.error("Erro ao iniciar o timer:", error);
        }
    }

    /**
     * Atualiza o timer do jogo
     */
    updateTimer() {
        try {
            // Verifica se o jogo está ativo
            if (!this.gameState.isGameActive) return;
            
            // Calcula o tempo restante
            const timeLeft = Math.max(0, this.gameState.timeLeft);
            
            // Aplica efeitos visuais baseados no tempo restante
            const gameScreen = document.getElementById('game-screen');
            
            if (timeLeft <= 10 && timeLeft > 5) {
                console.log("Aplicando efeito amarelo");
                gameScreen.classList.add('time-warning');
                gameScreen.classList.remove('time-danger');
            } else if (timeLeft <= 5 && timeLeft > 0) {
                console.log("Aplicando efeito vermelho");
                gameScreen.classList.remove('time-warning');
                gameScreen.classList.add('time-danger');
            } else {
                // Remove os efeitos visuais quando acima de 10 segundos
                gameScreen.classList.remove('time-warning', 'time-danger');
            }
        } catch (error) {
            console.error("Erro ao atualizar o timer:", error);
        }
    }

    /**
     * Aplica efeito visual baseado no tempo restante
     * @param {number} timeLeft - Tempo restante em segundos
     */
    applyTimeEffect(timeLeft) {
        const gameScreen = document.getElementById('game-screen');
        const timer = document.getElementById('timer');
        const gameContainer = document.querySelector('.game-container');
        
        // Aplica efeito amarelo quando o tempo chegar a 10 segundos
        if (timeLeft <= 10 && timeLeft > 5) {
            console.log("Aplicando efeito amarelo");
            gameScreen.classList.add('time-warning');
            gameScreen.classList.remove('time-danger');
            document.body.style.backgroundColor = "rgba(255, 204, 0, 0.1)";
            
            // Adiciona uma borda pulsante ao timer
            timer.style.border = "1px solid #ff9900";
            
            // Adiciona um overlay amarelo à tela inteira
            if (!document.getElementById('time-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'time-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(255, 204, 0, 0.6)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '9999';
                overlay.style.animation = 'pulseYellowOverlay 1s infinite';
                document.body.appendChild(overlay);
            } else {
                const overlay = document.getElementById('time-overlay');
                overlay.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
                overlay.style.animation = 'pulseYellowOverlay 1s infinite';
            }
        } 
        // Aplica efeito vermelho quando o tempo chegar a 5 segundos
        else if (timeLeft <= 5 && timeLeft > 0) {
            console.log("Aplicando efeito vermelho");
            gameScreen.classList.remove('time-warning');
            gameScreen.classList.add('time-danger');
            document.body.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            
            // Adiciona uma borda pulsante ao timer
            timer.style.border = "2px solid #ff0000";
            
            // Adiciona um overlay vermelho à tela inteira
            if (!document.getElementById('time-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'time-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '9999';
                overlay.style.animation = 'pulseRedOverlay 0.7s infinite';
                document.body.appendChild(overlay);
            } else {
                const overlay = document.getElementById('time-overlay');
                overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                overlay.style.animation = 'pulseRedOverlay 0.7s infinite';
            }
        } else if (timeLeft > 10) {
            // Remove os efeitos quando o tempo estiver normal
            gameScreen.classList.remove('time-warning', 'time-danger');
            document.body.style.backgroundColor = "";
            
            // Remove a borda do timer
            timer.style.border = "";
            
            // Remove o overlay se existir
            const overlay = document.getElementById('time-overlay');
            if (overlay) {
                overlay.remove();
            }
        } else {
            // Remove os efeitos visuais
            gameScreen.classList.remove('time-warning', 'time-danger');
            document.body.style.backgroundColor = "";
            
            // Remove o overlay se existir
            const overlay = document.getElementById('time-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        }
    }

    /**
     * Finaliza o jogo com derrota por tempo esgotado
     */
    endGameTimeout() {
        try {
            // Remove os efeitos visuais
            const gameScreen = document.getElementById('game-screen');
            gameScreen.classList.remove('time-warning', 'time-danger');
            document.body.style.backgroundColor = "";
            
            // Remove o overlay se existir
            const overlay = document.getElementById('time-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
            
            // Exibir mensagem de derrota
            this.showResultMessage(false, this.gameState.isExplosiveBoosterPhase);
            
            // Finaliza o jogo com derrota
            this.gameState.finishGameWithLoss();
            
            // Mostra a tela de resultado
            this.showResultScreen(false);
        } catch (error) {
            console.error("Erro ao finalizar o jogo por timeout:", error);
        }
    }

    /**
     * Confirma o valor selecionado
     */
    confirmValue() {
        try {
            console.log("Método confirmValue chamado");
            console.log("Métodos disponíveis no gameState:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.gameState)));
            console.log("Estado do jogo ativo:", this.gameState.isGameActive);
            console.log("Fase atual:", this.gameState.currentPhase);
            console.log("Números corretos:", this.gameState.correctNumbers);
            console.log("Números selecionados:", this.gameState.selectedNumbers);
            
            if (!this.gameState.isGameActive) return;
            
            // Limpa os efeitos visuais de tempo
            this.clearTimeEffects();
            
            // Obtém o valor selecionado do dial
            const selectedValue = this.volumeDial.getValue();
            console.log("Chamando checkSelectedNumber com valor:", selectedValue);
            
            const isCorrect = this.gameState.checkSelectedNumber(selectedValue);
            console.log("Resultado do checkSelectedNumber:", isCorrect);
            
            if (isCorrect) {
                // Reproduz o som de sucesso
                if (window.audioManager) {
                    window.audioManager.playSound('success', 0.8);
                }
                
                const isPhaseComplete = this.gameState.isPhaseComplete();
                console.log("Fase completa?", isPhaseComplete);
                
                if (isPhaseComplete) {
                    console.log("Fase completa! Limpando timer e avançando...");
                    this.clearTimer();
                    
                    // Se estamos na fase do booster explosivo, finaliza o jogo com vitória
                    if (this.gameState.isExplosiveBoosterPhase) {
                        console.log("Fase do Booster Explosivo completa! Finalizando o jogo com vitória.");
                        this.finishGameWithWin();
                        return;
                    }
                    
                    // Avança para a próxima fase sem mostrar mensagem
                    setTimeout(() => {
                        this.advanceToNextPhase();
                    }, 1000);
                }
            } else {
                // Exibir mensagem de derrota
                this.showResultMessage(false, this.gameState.isExplosiveBoosterPhase);
                
                // Finaliza o jogo com derrota
                this.finishGameWithLoss();
            }
        } catch (error) {
            console.error("Erro ao confirmar valor:", error);
        }
    }

    /**
     * Limpa o valor selecionado
     */
    clearValue() {
        try {
            this.volumeDial.setValue(0);
            document.getElementById('selected-value-display').textContent = "Número: 0";
        } catch (error) {
            console.error("Erro ao limpar valor:", error);
        }
    }

    /**
     * Avança para a próxima fase
     */
    advanceToNextPhase() {
        try {
            console.log("Avançando para a próxima fase...");
            
            // Avança para a próxima fase no estado do jogo
            // O método retorna true quando todas as fases foram completadas ou estamos na fase do booster explosivo
            const isGameComplete = this.gameState.advanceToNextPhase();
            console.log(`Resultado do advanceToNextPhase: ${isGameComplete ? 'Jogo completo' : 'Ainda há mais fases'}`);
            console.log(`Fase atual: ${this.gameState.currentPhase}, isExplosiveBoosterPhase: ${this.gameState.isExplosiveBoosterPhase}`);
            
            // Mostra a tela de transição de fase
            this.showPhaseTransitionScreen();
            
            // Se estamos na fase do booster explosivo, configuramos um timeout para mostrar a tela do booster após a transição
            if (this.gameState.isExplosiveBoosterPhase) {
                console.log("Configurando timeout para mostrar a tela do booster explosivo após a transição");
                // O timeout é configurado dentro do método showPhaseTransitionScreen
            }
        } catch (error) {
            console.error("Erro ao avançar para a próxima fase:", error);
            // Fallback para mostrar o menu em caso de erro
            this.showScreen('menu');
        }
    }

    /**
     * Mostra a tela de transição de fase
     */
    showPhaseTransitionScreen() {
        try {
            this.showScreen('phaseTransition');
            
            // Atualiza o texto da fase - mostra a fase que acabou de ser concluída
            const completedPhase = this.gameState.currentPhase - 1;
            
            // Tratamento especial para a transição para o Booster Explosivo
            if (this.gameState.isExplosiveBoosterPhase) {
                document.getElementById('phase-transition-title').textContent = "Parabéns!";
                document.getElementById('phase-transition-phase').textContent = "FINAL";
                document.getElementById('phase-transition-text').textContent = "Todas as fases concluídas com sucesso!";
            }
            // Tratamento especial para a fase final
            else if (completedPhase === 3) {
                document.getElementById('phase-transition-phase').textContent = "FINAL";
                document.getElementById('phase-transition-text').textContent = "Etapa concluída com sucesso!";
            } 
            else {
                document.getElementById('phase-transition-phase').textContent = completedPhase.toString();
                document.getElementById('phase-transition-text').textContent = "Etapa concluída com sucesso!";
            }
            
            // Define um timeout para voltar para a tela do jogo
            setTimeout(() => {
                // Se estamos na fase do booster explosivo, mostra a tela do booster explosivo
                if (this.gameState.isExplosiveBoosterPhase) {
                    this.showExplosiveBoosterScreen();
                } else {
                    // Caso contrário, mostra a tela de booster e contagem regressiva
                    this.showBoosterAndCountdown();
                }
            }, 3000);
        } catch (error) {
            console.error("Erro ao mostrar a tela de transição de fase:", error);
        }
    }

    /**
     * Mostra a tela do booster explosivo
     */
    showExplosiveBoosterScreen() {
        try {
            // Seleciona um booster explosivo
            this.gameState.selectExplosiveBooster();
            
            // Mostra a tela do booster explosivo
            this.showScreen('explosiveBooster');
            
            // Atualiza o valor do booster explosivo
            const boosterValueElement = document.getElementById('explosive-booster-value');
            boosterValueElement.textContent = `${this.gameState.explosiveBooster.value}X`;
            
            // Adiciona cor ao valor do booster baseado no valor
            if (this.gameState.explosiveBooster.color) {
                boosterValueElement.style.color = this.gameState.explosiveBooster.color;
            } else {
                // Cor padrão baseada no valor
                if (this.gameState.explosiveBooster.value >= 20) {
                    boosterValueElement.style.color = '#FF0000'; // Vermelho para valores altos
                } else if (this.gameState.explosiveBooster.value >= 10) {
                    boosterValueElement.style.color = '#FF6600'; // Laranja para valores médios
                } else {
                    boosterValueElement.style.color = '#0066FF'; // Azul para valores baixos
                }
            }
            
            // Calcula e exibe o prêmio atual e potencial
            const currentPrize = this.gameState.calculateCurrentPrize();
            const potentialPrize = this.gameState.calculateExplosivePrize();
            
            document.getElementById('current-prize').textContent = `R$ ${currentPrize.toFixed(2)}`;
            document.getElementById('potential-prize').textContent = `R$ ${potentialPrize.toFixed(2)}`;
            
            // Configura os event listeners para os botões se ainda não estiverem configurados
            if (!this.explosiveBoosterButtonsConfigured) {
                document.getElementById('stop-button').addEventListener('click', () => this.finishGameWithWin(false));
                document.getElementById('continue-button').addEventListener('click', () => this.startExplosiveBoosterPhase());
                this.explosiveBoosterButtonsConfigured = true;
            }
        } catch (error) {
            console.error("Erro ao mostrar a tela do booster explosivo:", error);
        }
    }

    /**
     * Finaliza o jogo com o prêmio atual (sem arriscar o booster explosivo)
     * @deprecated Use processExplosiveBoosterResult(false) em vez disso
     */
    stopWithCurrentPrize() {
        this.processExplosiveBoosterResult(false);
    }

    /**
     * Processa o resultado do booster explosivo
     * @param {boolean} continueGame - Se o jogador optou por continuar (true) ou parar (false)
     */
    processExplosiveBoosterResult(continueGame) {
        try {
            console.log(`Processando resultado do booster explosivo: ${continueGame ? 'Continuar' : 'Parar'}`);
            
            if (continueGame) {
                // Se o jogador optou por continuar, inicia a fase do booster explosivo
                this.startExplosiveBoosterPhase();
                
                // Mostra uma mensagem de incentivo para a fase do booster explosivo
                const message = "Vamos lá! Você está prestes a ganhar muito!";
                this.showMessage(message);
                
                // Mostra a tela de jogo do booster explosivo
                this.showExplosiveBoosterGameScreen();
            } else {
                // Se o jogador optou por parar, finaliza o jogo com vitória
                const prize = this.gameState.calculateCurrentPrize();
                console.log(`Jogador optou por parar. Prêmio final: ${prize.toFixed(2)}`);
                
                // Finaliza o jogo com vitória (sem o booster explosivo)
                this.gameState.finishGameWithWin(false);
                
                // Atualiza o display do saldo
                this.updateBalanceDisplay();
                
                // Mostra a tela de resultado
                this.showResultScreen(false);
            }
        } catch (error) {
            console.error("Erro ao processar resultado do booster explosivo:", error);
        }
    }
    
    /**
     * Inicia a fase do booster explosivo
     */
    startExplosiveBoosterPhase() {
        try {
            // Limpa o timer atual
            this.clearTimer();
            
            // Configura a fase do booster explosivo
            this.gameState.isExplosiveBoosterPhase = true;
            
            // Garante que não estamos em uma fase 4
            if (this.gameState.currentPhase > GameConfig.totalPhases) {
                console.log(`Corrigindo fase atual de ${this.gameState.currentPhase} para ${GameConfig.totalPhases}`);
                this.gameState.currentPhase = GameConfig.totalPhases;
            }
            
            // Gera o número correto para o booster explosivo
            this.gameState.generateCorrectNumbers();
            
            console.log(`Fase do Booster Explosivo iniciada - Booster: ${this.gameState.explosiveBooster.value}X`);
            
            // Mostra a tela de jogo
            this.showScreen('game');
            
            // Atualiza o número da fase na tela
            document.getElementById('phase-number').textContent = "Booster";
            
            // Atualiza a descrição da fase para mostrar o intervalo correto (1 a 3)
            document.getElementById('phase-description').textContent = "1 a 3";
            
            // Reinicia o dial para a posição inicial
            if (this.volumeDial) {
                this.volumeDial.resetDial();
            }
            
            // Calcula o prêmio potencial (já com o booster explosivo aplicado)
            const potentialPrize = this.gameState.calculateExplosivePrize();
            
            // Atualiza o valor do prêmio atual na tela do jogo para mostrar o valor potencial
            document.getElementById('current-value').textContent = potentialPrize.toFixed(2);
            
            // Inicia o timer
            this.startTimer();
        } catch (error) {
            console.error("Erro ao iniciar a fase do booster explosivo:", error);
            throw error;
        }
    }
    
    /**
     * Mostra a tela de jogo do booster explosivo
     */
    showExplosiveBoosterGameScreen() {
        try {
            // Atualiza o cabeçalho da tela de jogo
            document.getElementById('phase-number').textContent = "Booster Explosivo";
            
            // Exibe apenas o valor do booster explosivo com o ícone de raio
            document.getElementById('booster-indicator').innerHTML = `${this.gameState.explosiveBooster.value}X`;
            document.getElementById('booster-indicator').style.color = this.gameState.explosiveBooster.color;
            
            // Calcula o prêmio potencial (já com o booster explosivo aplicado)
            const potentialPrize = this.gameState.calculateExplosivePrize();
            
            // Atualiza o valor do prêmio atual na tela do jogo para mostrar o valor potencial
            document.getElementById('current-value').textContent = potentialPrize.toFixed(2);
            
            // Mostra a tela de jogo
            this.showScreen('game');
            
            // Configura o dial para a fase do booster explosivo
            this.setupDialForPhase();
            
            // Atualiza o valor selecionado
            this.updateSelectedValue(null);
        } catch (error) {
            console.error("Erro ao mostrar tela de jogo do booster explosivo:", error);
        }
    }

    /**
     * Exibe uma mensagem de incentivo
     * @param {string} message - Mensagem a ser exibida
     */
    showMessage(message) {
        try {
            const messageDisplay = document.getElementById('message-display');
            if (messageDisplay) {
                messageDisplay.textContent = message;
                messageDisplay.style.display = 'block';
            }
        } catch (error) {
            console.error("Erro ao exibir mensagem:", error);
        }
    }

    /**
     * Limpa a mensagem de incentivo
     */
    clearMessage() {
        try {
            const messageDisplay = document.getElementById('message-display');
            if (messageDisplay) {
                messageDisplay.textContent = '';
                messageDisplay.style.display = 'none';
            }
        } catch (error) {
            console.error("Erro ao limpar mensagem:", error);
        }
    }

    /**
     * Exibe uma mensagem de incentivo baseada na fase e resultado
     * @param {boolean} isWin - Se o jogador ganhou ou perdeu
     * @param {boolean} isExplosivePhase - Se é a fase do booster explosivo
     */
    showResultMessage(isWin, isExplosivePhase = false) {
        try {
            let messageCategory;
            
            if (isExplosivePhase) {
                messageCategory = isWin ? 'explosiveBoosterWin' : 'explosiveBoosterLoss';
            } else {
                const phase = this.gameState.currentPhase;
                if (phase === 3) {
                    messageCategory = isWin ? 'phase3Win' : 'phase3Loss';
                } else {
                    messageCategory = isWin ? `phase${phase}Win` : `phase${phase}Loss`;
                }
            }
            
            const message = GameMessages.getRandomMessage(messageCategory);
            const messageElement = document.getElementById('result-message');
            messageElement.innerHTML = message;
            messageElement.style.display = 'block';
            console.log("Mensagem definida:", message);
            console.log("Elemento:", messageElement);
            console.log("Estilo computado:", window.getComputedStyle(messageElement));
            console.log("Visibilidade:", window.getComputedStyle(messageElement).visibility);
            console.log("Display:", window.getComputedStyle(messageElement).display);
            console.log("Z-index:", window.getComputedStyle(messageElement).zIndex);
        } catch (error) {
            console.error("Erro ao exibir mensagem de resultado:", error);
        }
    }

    /**
     * Mostra a tela de resultado
     * @param {boolean} isWin - Se o jogador ganhou
     * @param {number} prize - Valor do prêmio (se ganhou)
     */
    showResultScreen(isWin, prize = 0) {
        try {
            console.log("Iniciando showResultScreen, isWin:", isWin);
            
            // Reproduz o som de sucesso se o jogador ganhou
            if (isWin && window.audioManager) {
                window.audioManager.playSound('success', 1.0);
            }
            
            // Mostra a tela de resultado
            this.showScreen('result');
            
            // Atualiza o título da tela de resultado
            document.getElementById('result-title').textContent = isWin ? 'Você é o melhor!!' : 'Não foi desta vez!';
            
            // Referência ao container do prêmio
            const prizeContainer = document.getElementById('result-prize-container');
            
            // Define a mensagem baseada no resultado
            if (isWin) {
                document.getElementById('result-message').innerHTML = '';
                // Esconde a informação da fase quando ganha
                const phaseInfoElement = document.querySelector('#result-screen .phase-info');
                if (phaseInfoElement) {
                    phaseInfoElement.style.display = 'none';
                }
                
                // Mostra o valor do prêmio
                if (prizeContainer) {
                    prizeContainer.style.display = 'block';
                }
                
                // Atualiza o valor do prêmio
                const prizeValue = this.gameState.calculateFinalPrize();
                document.getElementById('result-prize').textContent = `${prizeValue.toFixed(2)}`;
            } else {
                // Oculta o valor do prêmio quando perde
                if (prizeContainer) {
                    prizeContainer.style.display = 'none';
                }
                
                // Seleciona a mensagem de derrota apropriada para a fase atual
                let message = '';
                const currentPhase = this.gameState.currentPhase;
                
                if (this.gameState.isExplosiveBoosterPhase) {
                    // Mensagens para o Booster Explosivo
                    const messages = [
                        "O cofre explodiu… e levou seu prêmio junto! Que pena!",
                        "Foi por pouco! Um novo cofre te espera",
                        "Coragem não faltou! Agora é respirar fundo e tentar novamente!"
                    ];
                    message = messages[Math.floor(Math.random() * messages.length)];
                } else if (currentPhase === 1) {
                    // Mensagens para a Fase 1
                    const messages = [
                        "O cofre explodiu... mas você pode tentar de novo!",
                        "Ajuste a estratégia e tente outra vez!",
                        "Não desista! O segredo do cofre ainda pode ser seu!"
                    ];
                    message = messages[Math.floor(Math.random() * messages.length)];
                } else if (currentPhase === 2) {
                    // Mensagens para a Fase 2
                    const messages = [
                        "Foi por pouco! O cofre explodiu!",
                        "Nada de desânimo! Existem outros cofres para abrir!",
                        "O cofre explodiu, mas o próximo pode ser o seu!"
                    ];
                    message = messages[Math.floor(Math.random() * messages.length)];
                } else if (currentPhase === 3) {
                    // Mensagens para a Fase 3
                    const messages = [
                        "Por um triz... o cofre explodiu!",
                        "Faltou só um detalhe! Tente um novo cofre!",
                        "Essa foi por pouco! Volte e tente um cofre novo!"
                    ];
                    message = messages[Math.floor(Math.random() * messages.length)];
                } else {
                    // Mensagem padrão
                    message = "O cofre explodiu... mas você pode tentar de novo!";
                }
                
                // Define a mensagem na tela
                const messageElement = document.getElementById('result-message');
                if (messageElement) {
                    messageElement.innerHTML = message;
                    messageElement.style.display = 'block';
                    console.log("Mensagem definida:", message);
                    console.log("Elemento:", messageElement);
                    console.log("Estilo computado:", window.getComputedStyle(messageElement));
                    console.log("Visibilidade:", window.getComputedStyle(messageElement).visibility);
                    console.log("Display:", window.getComputedStyle(messageElement).display);
                    console.log("Z-index:", window.getComputedStyle(messageElement).zIndex);
                }
                
                // Mostra a fase em que o jogador perdeu
                const phaseInfoElement = document.querySelector('#result-screen .phase-info');
                if (phaseInfoElement) {
                    phaseInfoElement.style.display = 'block';
                    const phaseText = this.gameState.isExplosiveBoosterPhase ? 
                        'Booster Explosivo' : 
                        `Fase ${this.gameState.currentPhase}`;
                    phaseInfoElement.querySelector('h2').innerHTML = phaseText;
                }
            }
            
            // Atualiza o saldo
            this.updateBalanceDisplay();
        } catch (error) {
            console.error("Erro ao mostrar tela de resultado:", error);
        }
    }

    /**
     * Atualiza o saldo do jogador
     * @param {number} prize - Valor do prêmio
     * @deprecated Este método não deve ser usado diretamente. Use gameState.finishGameWithWin() em vez disso.
     */
    updatePlayerBalance(prize) {
        try {
            // Atualiza o saldo do jogador
            this.gameState.playerBalance += prize;
            
            // Log do prêmio e saldo
            console.log(`Prêmio adicionado ao saldo: ${prize.toFixed(2)}`);
            console.log(`Novo saldo: ${this.gameState.playerBalance.toFixed(2)}`);
            
            // Atualiza o display do saldo
            this.updateBalanceDisplay();
        } catch (error) {
            console.error("Erro ao atualizar saldo do jogador:", error);
        }
    }

    /**
     * Finaliza o jogo com vitória
     */
    finishGameWithWin() {
        try {
            // Limpa o timer
            this.clearTimer();
            
            // Calcula o prêmio final
            let prize;
            if (this.gameState.isExplosiveBoosterPhase) {
                prize = this.gameState.calculateExplosivePrize();
            } else {
                prize = this.gameState.calculateCurrentPrize();
            }
            
            // Finaliza o jogo com vitória
            this.gameState.finishGameWithWin(this.gameState.isExplosiveBoosterPhase);
            
            // Atualiza o display do saldo
            this.updateBalanceDisplay();
            
            // Mostra a tela de resultado
            this.showResultScreen(true, prize);
        } catch (error) {
            console.error("Erro ao finalizar o jogo com vitória:", error);
        }
    }
    
    /**
     * Finaliza o jogo com derrota
     */
    finishGameWithLoss() {
        try {
            // Limpa o timer
            this.clearTimer();
            
            // Finaliza o jogo com derrota
            this.gameState.finishGameWithLoss();
            
            // Mostra a tela de resultado
            this.showResultScreen(false);
        } catch (error) {
            console.error("Erro ao finalizar o jogo com derrota:", error);
        }
    }

    /**
     * Limpa o timer do jogo
     */
    clearTimer() {
        try {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                console.log("Timer limpo com sucesso");
            }
        } catch (error) {
            console.error("Erro ao limpar o timer:", error);
        }
    }

    /**
     * Configura o dial para a fase atual
     */
    setupDialForPhase() {
        try {
            // Configurações do dial baseadas na fase atual
            let dialConfig;
            
            if (this.gameState.isExplosiveBoosterPhase) {
                // Se estamos na fase do booster explosivo, use a configuração específica do explosivePhase
                const explosivePhase = GameConfig.explosivePhase;
                dialConfig = {
                    positions: explosivePhase.positions,
                    minValue: explosivePhase.minValue,
                    maxValue: explosivePhase.maxValue,
                    correctNumbers: this.gameState.correctNumbers,
                    showValue: true,
                    phase: "explosiveBooster"
                };
                console.log("Configurando dial para fase do Booster Explosivo:", dialConfig);
            } else {
                // Caso contrário, use a fase atual das configurações
                const phase = GameConfig.phases.find(p => p.number === this.gameState.currentPhase);
                
                if (!phase) {
                    console.error(`Fase não encontrada: ${this.gameState.currentPhase}`);
                    return;
                }
                
                dialConfig = {
                    positions: phase.positions,
                    minValue: phase.minValue,
                    maxValue: phase.maxValue,
                    correctNumbers: this.gameState.correctNumbers,
                    showValue: true,
                    phase: phase.number
                };
                console.log(`Configurando dial para fase ${this.gameState.currentPhase}:`, dialConfig);
            }
            
            // Inicializa o dial
            this.volumeDial = new VolumeDial('rotary-dial-container', dialConfig);
            
            // Atualiza o display do valor selecionado
            this.volumeDial.onValueChange = (value) => {
                document.getElementById('selected-value-display').textContent = `Número: ${value}`;
            };
        } catch (error) {
            console.error("Erro ao configurar dial para a fase:", error);
        }
    }

    updateSelectedValue(value) {
        this.volumeDial.setValue(value);
        
        // Exibe um traço quando não há valor selecionado
        if (value === null || value === undefined) {
            document.getElementById('selected-value-display').textContent = `Número: -`;
        } else {
            document.getElementById('selected-value-display').textContent = `Número: ${value}`;
        }
    }

    /**
     * Reinicia o jogo completamente e mostra a tela inicial
     */
    resetAndStartNewGame() {
        try {
            console.log("Reiniciando o jogo completamente...");
            
            // Reinicia o estado do jogo
            this.gameState.resetGame();
            
            // Limpa qualquer timer existente
            this.clearTimer();
            
            // Limpa os efeitos visuais de tempo
            this.clearTimeEffects();
            
            // Atualiza o display do saldo
            this.updateBalanceDisplay();
            
            // Reseta o dial para a posição inicial
            if (this.volumeDial) {
                this.volumeDial.resetDial();
            }
            
            // Volta para a tela de menu
            this.showScreen('menu');
            
            // Reproduz o som de clique
            if (window.audioManager) {
                window.audioManager.playSound('click', 0.5);
                window.audioManager.playBackgroundMusic();
            }
        } catch (error) {
            console.error("Erro ao reiniciar o jogo:", error);
        }
    }

    /**
     * Limpa os efeitos visuais de tempo
     */
    clearTimeEffects() {
        const timerCircle = document.querySelector('.timer-circle');
        if (timerCircle) {
            timerCircle.classList.remove('time-warning', 'time-danger');
        }
        document.body.style.backgroundColor = "";
        const overlay = document.getElementById('time-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }

    /**
     * Carrega os recursos necessários para o jogo
     */
    loadGameResources() {
        // Lista de recursos a serem carregados
        const resources = [
            // Imagens
            'images/cofre_main.png',
            'images/explosion.png',
            'images/dial-bg.png',
            // Sons
            'sounds/click.mp3',
            'sounds/countdown.mp3',
            'sounds/explosion.mp3',
            'sounds/success.mp3',
            'sounds/dial-click.mp3'
        ];
        
        let loadedResources = 0;
        const totalResources = resources.length;
        
        // Função para verificar se todos os recursos foram carregados
        const checkAllResourcesLoaded = () => {
            loadedResources++;
            
            // Atualizar barra de progresso
            const progressPercentage = (loadedResources / totalResources) * 100;
            console.log(`Carregamento: ${progressPercentage.toFixed(0)}%`);
            this.updateLoadingProgress(progressPercentage);
            
            // Se todos os recursos foram carregados, mostrar o menu
            if (loadedResources >= totalResources) {
                console.log('Todos os recursos carregados');
                this.showScreen('menu');
            }
        };
        
        // Carregar cada recurso
        resources.forEach(resource => {
            if (resource.endsWith('.png') || resource.endsWith('.jpg') || resource.endsWith('.gif')) {
                // Carregar imagem
                const img = new Image();
                img.onload = checkAllResourcesLoaded;
                img.onerror = checkAllResourcesLoaded; // Continuar mesmo se houver erro
                img.src = resource;
            } else if (resource.endsWith('.mp3') || resource.endsWith('.wav')) {
                // Carregar áudio
                const audio = new Audio();
                audio.oncanplaythrough = checkAllResourcesLoaded;
                audio.onerror = checkAllResourcesLoaded; // Continuar mesmo se houver erro
                audio.src = resource;
                // Pré-carregar o áudio
                audio.load();
            } else {
                // Outro tipo de recurso
                checkAllResourcesLoaded();
            }
        });
        
        // Definir um tempo máximo de carregamento (fallback)
        setTimeout(() => {
            if (loadedResources < totalResources) {
                console.log('Tempo máximo de carregamento atingido');
                this.showScreen('menu');
            }
        }, 10000); // 10 segundos de tempo máximo
    }

    updateLoadingProgress(progress) {
        const loadingBar = document.getElementById('loading-progress');
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
            
            // Se o carregamento estiver completo, remover a animação automática
            if (progress >= 100) {
                const loader = document.querySelector('.progress-loader');
                if (loader) {
                    // Remover o pseudo-elemento ::after que contém a animação automática
                    const style = document.createElement('style');
                    style.textContent = '.progress-loader::after { display: none; }';
                    document.head.appendChild(style);
                }
            }
        }
    }
}