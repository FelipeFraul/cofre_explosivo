/**
 * Classe que gerencia o estado do jogo
 */
class GameState {
    constructor() {
        this.reset();
        this.loadPlayerData();
        this.completedPhasesBoosters = [];
    }

    /**
     * Reinicia o estado do jogo
     */
    reset() {
        // Dados do jogador
        this.playerBalance = GameConfig.initialBalance;
        this.playerBet = 0;
        this.currentBooster = null;
        this.explosiveBooster = null;
        this.totalWin = 0;

        // Estado do jogo
        this.currentPhase = 1;
        this.correctNumbers = [];
        this.selectedNumbers = [];
        this.isGameActive = false;
        this.isExplosiveBoosterPhase = false;
        this.completedPhasesBoosters = [];
    }

    /**
     * Carrega os dados do jogador do armazenamento local
     */
    loadPlayerData() {
        const savedBalance = localStorage.getItem('playerBalance');
        if (savedBalance) {
            this.playerBalance = parseFloat(savedBalance);
        }
    }

    /**
     * Salva os dados do jogador no armazenamento local
     */
    savePlayerData() {
        localStorage.setItem('playerBalance', this.playerBalance.toString());
    }

    /**
     * Define a aposta do jogador
     * @param {number} amount - Valor da aposta
     */
    setBet(amount) {
        this.playerBet = amount;
    }

    /**
     * Inicia um novo jogo
     * @param {number} bet - Valor da aposta
     * @returns {boolean} - Verdadeiro se o jogo foi iniciado com sucesso
     */
    startGame(bet) {
        // Verifica se o jogador tem saldo suficiente
        if (bet > this.playerBalance) {
            console.log(`Saldo insuficiente: ${this.playerBalance} < ${bet}`);
            return false;
        }
        
        // Deduz a aposta do saldo
        this.playerBalance -= bet;
        this.playerBet = bet;
        this.savePlayerData();
        
        // Configura o jogo
        this.currentPhase = 1;
        this.correctNumbers = this.generateCorrectNumbers();
        this.selectedNumbers = [];
        this.isGameActive = true;
        this.isExplosiveBoosterPhase = false;
        this.completedPhasesBoosters = [];
        this.currentBooster = null; // Garantir que o booster anterior seja limpo
        this.timeLeft = GameConfig.timePerPhase; // Reiniciar o tempo

        // Seleciona um booster aleatório
        this.selectRandomBooster();
        
        console.log(`Jogo iniciado - Aposta: ${this.playerBet.toFixed(2)}, Booster: ${this.currentBooster.value}X`);

        return true;
    }

    /**
     * Seleciona um booster aleatório para a fase atual
     */
    selectRandomBooster() {
        const phaseBoosterOptions = GameConfig.boostersByPhase[this.currentPhase];
        if (!phaseBoosterOptions || phaseBoosterOptions.length === 0) {
            console.error(`Erro: Não há boosters definidos para a fase ${this.currentPhase}`);
            // Fallback para um booster padrão
            this.currentBooster = { value: 1, color: '#FFFFFF' };
            return;
        }
        
        const randomValue = Math.random() * 100;
        let cumulativeProbability = 0;
        
        console.log(`Selecionando booster para fase ${this.currentPhase} - Opções disponíveis:`, 
            phaseBoosterOptions.map(b => `${b.value}X (${b.probability}%)`).join(', '));
        console.log(`Valor aleatório gerado: ${randomValue.toFixed(2)}`);

        for (const booster of phaseBoosterOptions) {
            cumulativeProbability += booster.probability;
            console.log(`Verificando booster ${booster.value}X - Probabilidade acumulada: ${cumulativeProbability}%`);
            
            if (randomValue <= cumulativeProbability) {
                this.currentBooster = { ...booster };
                console.log(`Booster selecionado para fase ${this.currentPhase}: ${this.currentBooster.value}X (${this.currentBooster.color})`);
                return;
            }
        }

        // Fallback para o primeiro booster caso algo dê errado
        this.currentBooster = { ...phaseBoosterOptions[0] };
        console.log(`Fallback: Booster selecionado para fase ${this.currentPhase}: ${this.currentBooster.value}X (${this.currentBooster.color})`);
    }

    /**
     * Seleciona um booster explosivo aleatório para a fase final
     */
    selectExplosiveBooster() {
        const explosiveBoosterOptions = GameConfig.boostersByPhase.explosive; // Usa a configuração específica para o booster explosivo
        const randomValue = Math.random() * 100;
        let cumulativeProbability = 0;

        console.log(`Selecionando booster explosivo - Opções disponíveis:`, 
            explosiveBoosterOptions.map(b => `${b.value}X (${b.probability}%)`).join(', '));
        console.log(`Valor aleatório gerado: ${randomValue.toFixed(2)}`);

        for (const booster of explosiveBoosterOptions) {
            cumulativeProbability += booster.probability;
            console.log(`Verificando booster explosivo ${booster.value}X - Probabilidade acumulada: ${cumulativeProbability}%`);
            
            if (randomValue <= cumulativeProbability) {
                this.explosiveBooster = { ...booster };
                console.log(`Booster explosivo selecionado: ${this.explosiveBooster.value}X (${this.explosiveBooster.color})`);
                return;
            }
        }

        // Fallback para o primeiro booster caso algo dê errado
        this.explosiveBooster = { ...explosiveBoosterOptions[0] };
        console.log(`Fallback: Booster explosivo selecionado: ${this.explosiveBooster.value}X (${this.explosiveBooster.color})`);
    }

    /**
     * Gera os números corretos para a fase atual
     */
    generateCorrectNumbers() {
        let phase;
        
        // Verifica se está na fase do booster explosivo
        if (this.isExplosiveBoosterPhase) {
            phase = GameConfig.explosivePhase;
            console.log("Usando configuração da fase do Booster Explosivo");
        } else {
            phase = GameConfig.phases.find(p => p.number === this.currentPhase);
        }
        
        // Verifica se a fase foi encontrada
        if (!phase) {
            console.error(`Fase ${this.currentPhase} não encontrada na configuração`);
            return [];
        }
        
        const correctNumbers = [];

        // Gera a quantidade necessária de números corretos para a fase
        for (let i = 0; i < phase.requiredCorrectNumbers; i++) {
            let correctNumber;
            do {
                correctNumber = Math.floor(Math.random() * (phase.maxValue - phase.minValue + 1)) + phase.minValue;
            } while (correctNumbers.includes(correctNumber));
            
            correctNumbers.push(correctNumber);
        }
        
        // Log dos números corretos no console
        if (this.isExplosiveBoosterPhase) {
            console.log(`[${correctNumbers.join(', ')}]`);
        } else {
            console.log(`[${correctNumbers.join(', ')}]`);
        }
        
        this.correctNumbers = correctNumbers;
        return correctNumbers;
    }

    /**
     * Verifica se o número selecionado é correto
     * @param {number} number - Número selecionado
     * @returns {boolean} - Verdadeiro se o número for correto
     */
    checkSelectedNumber(number) {
        // Verifica se o jogo está ativo
        if (!this.isGameActive) {
            console.log(`Jogo não está ativo. Não é possível verificar o número.`);
            return false;
        }
        
        // Adiciona o número à lista de selecionados se ainda não estiver lá
        if (!this.selectedNumbers.includes(number)) {
            this.selectedNumbers.push(number);
        }
        
        // Verifica se o número está na lista de corretos
        const isCorrect = this.correctNumbers.includes(number);
        // Não exibimos mais o status do número selecionado
        
        // Se o número for incorreto, finaliza o jogo
        if (!isCorrect) {
            this.isGameActive = false;
            console.log(`Jogo finalizado - Número incorreto selecionado: ${number}`);
            return false;
        }
        
        return true;
    }

    /**
     * Adiciona um número à lista de números selecionados
     * @param {number} number - Número selecionado
     */
    addSelectedNumber(number) {
        if (!this.selectedNumbers.includes(number)) {
            this.selectedNumbers.push(number);
        }
    }

    /**
     * Verifica se o jogador completou a fase atual
     * @returns {boolean} - Verdadeiro se a fase estiver completa
     */
    isPhaseComplete() {
        // Se estamos na fase do booster explosivo, não devemos avançar para uma nova fase
        if (this.isExplosiveBoosterPhase) {
            console.log(`Fase do Booster Explosivo completa! Número correto encontrado.`);
            return true;
        }
        
        // Verifica se pelo menos um dos números selecionados está na lista de números corretos
        for (const num of this.selectedNumbers) {
            if (this.correctNumbers.includes(num)) {
                console.log(`Fase ${this.currentPhase} completa! Número correto ${num} encontrado.`);
                return true;
            }
        }
        return false;
    }

    /**
     * Avança para a próxima fase do jogo
     * @returns {boolean} - true se o jogo foi completado (todas as fases), false se ainda há mais fases
     */
    advanceToNextPhase() {
        // Se já estamos na fase do booster explosivo, não devemos avançar mais
        if (this.isExplosiveBoosterPhase) {
            console.log(`Jogo finalizado com vitória! Booster explosivo: ${this.explosiveBooster.value}X`);
            // Não chamamos finishGameWithWin aqui, pois isso atualizaria o saldo prematuramente
            return true; // Jogo completo
        }
        
        // Salva o booster da fase atual
        if (this.currentBooster) {
            console.log(`Salvando booster da fase ${this.currentPhase}: ${this.currentBooster.value}X`);
            this.completedPhasesBoosters.push({...this.currentBooster});
            console.log(`Boosters acumulados: ${this.completedPhasesBoosters.map(b => b.value).join('X, ')}X`);
        } else {
            console.error(`Erro: Não há booster para a fase ${this.currentPhase}`);
        }

        // Limpa os números selecionados
        this.selectedNumbers = [];
        
        // Avança para a próxima fase
        this.currentPhase++;
        console.log(`Avançando para a fase ${this.currentPhase}`);
        console.log(`Total de fases: ${GameConfig.totalPhases}`);
        
        // Verifica se ainda há fases
        if (this.currentPhase <= GameConfig.totalPhases) {
            console.log(`Iniciando fase ${this.currentPhase}`);
            
            // Gera novos números corretos
            this.correctNumbers = this.generateCorrectNumbers();
            
            // Seleciona um novo booster
            this.selectRandomBooster();
            
            return false; // Ainda há mais fases
        } else {
            // Se todas as fases foram completadas, configura o booster explosivo
            this.isExplosiveBoosterPhase = true;
            this.selectExplosiveBooster();
            
            console.log(`Todas as fases completadas. Iniciando fase do booster explosivo.`);
            return true; // Jogo completo (todas as fases normais)
        }
    }

    /**
     * Calcula o valor do prêmio atual baseado nos boosters acumulados
     * @returns {number} - Valor do prêmio
     */
    calculateCurrentPrize() {
        // Inicializa com o valor da aposta
        let prize = this.playerBet;
        console.log(`Cálculo do prêmio - Aposta inicial: ${prize}`);
        console.log(`Fase atual: ${this.currentPhase}, Booster atual: ${this.currentBooster ? this.currentBooster.value : 'nenhum'}`);
        console.log(`Boosters acumulados: ${JSON.stringify(this.completedPhasesBoosters.map(b => b.value))}`);
        
        // Aplica o multiplicador acumulado das fases completadas
        if (this.completedPhasesBoosters && this.completedPhasesBoosters.length > 0) {
            console.log(`Aplicando ${this.completedPhasesBoosters.length} boosters acumulados:`);
            
            for (let i = 0; i < this.completedPhasesBoosters.length; i++) {
                const phaseBooster = this.completedPhasesBoosters[i];
                if (phaseBooster && phaseBooster.value) {
                    console.log(`Fase ${i+1} - Booster: ${phaseBooster.value}x`);
                    prize *= phaseBooster.value;
                    console.log(`Prêmio após fase ${i+1}: ${prize}`);
                } else {
                    console.error(`Booster inválido para fase ${i+1}:`, phaseBooster);
                }
            }
        } else {
            console.log(`Nenhum booster acumulado ainda.`);
        }
        
        // Aplica o booster da fase atual se estiver em uma fase ativa
        if (this.isGameActive && this.currentBooster && !this.isExplosiveBoosterPhase) {
            console.log(`Aplicando booster da fase atual (${this.currentPhase}): ${this.currentBooster.value}x`);
            prize *= this.currentBooster.value;
            console.log(`Prêmio com booster atual: ${prize}`);
        }
        
        console.log(`Prêmio final calculado: ${prize}`);
        return prize;
    }

    /**
     * Calcula o valor do prêmio potencial com o booster explosivo
     * @returns {number} - Valor do prêmio potencial
     */
    calculateExplosivePrize() {
        // Primeiro calcula o prêmio das fases normais
        let prize = this.calculateCurrentPrize();
        console.log(`Prêmio base antes do booster explosivo: ${prize}`);
        
        // Multiplica pelo booster explosivo
        if (this.explosiveBooster) {
            console.log(`Aplicando booster explosivo: ${this.explosiveBooster.value}x`);
            prize *= this.explosiveBooster.value;
            console.log(`Prêmio final com booster explosivo: ${prize}`);
        } else {
            console.error(`ERRO: Booster explosivo não definido!`);
        }
        
        return prize;
    }

    /**
     * Obtém o booster de uma fase específica
     * @param {number} phase - Número da fase
     * @returns {object} - Booster da fase
     */
    getPhaseBooster(phase) {
        if (phase === this.currentPhase) {
            return this.currentBooster;
        } else if (phase < this.currentPhase && phase >= 1) {
            // Índice no array é phase - 1
            // Verificamos se o índice está dentro dos limites do array
            if (phase - 1 < this.completedPhasesBoosters.length) {
                return this.completedPhasesBoosters[phase - 1];
            }
        }
        return null;
    }

    /**
     * Reinicia o jogo para uma nova partida
     */
    resetGame() {
        this.reset();
        console.log("Estado do jogo reiniciado para uma nova partida");
    }

    /**
     * Finaliza o jogo com vitória
     * @param {boolean} withExplosiveBooster - Se o jogador optou pelo booster explosivo
     */
    finishGameWithWin(withExplosiveBooster = false) {
        // Calcula o prêmio
        const prize = withExplosiveBooster ? this.calculateExplosivePrize() : this.calculateCurrentPrize();
        this.totalWin = prize;
        
        // Adiciona o prêmio ao saldo do jogador
        this.playerBalance += prize;
        this.savePlayerData();
        
        // Finaliza o jogo
        this.isGameActive = false;
        this.isExplosiveBoosterPhase = false;
        
        return prize;
    }

    /**
     * Finaliza o jogo com derrota
     */
    finishGameWithLoss() {
        // Finaliza o jogo sem adicionar prêmio
        this.isGameActive = false;
        this.isExplosiveBoosterPhase = false;
        this.totalWin = 0;
        
        return 0;
    }
}