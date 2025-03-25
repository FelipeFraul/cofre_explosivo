/**
 * Configurações do jogo Cofre Explosivo
 * Este arquivo contém todas as configurações ajustáveis do jogo
 */
const GameConfig = {
    // Configurações gerais
    initialBalance: 10.00,
    totalPhases: 3,
    
    // Configurações de apostas
    betOptions: [0.25, 0.50, 1.00, 2.50, 5.00, 10.00],
    
    // Configurações de boosters (multiplicadores) por fase
    boostersByPhase: {
        // Fase 1 (Início do jogo)
        1: [
            { value: 2, probability: 70, color: '#000000' }, // Preto
            { value: 3, probability: 30, color: '#FFD700' }  // Amarelo
        ],
        // Fase 2 (Avançando no desafio)
        2: [
            { value: 3, probability: 70, color: '#FFD700' }, // Amarelo
            { value: 4, probability: 30, color: '#FFA500' }  // Laranja
        ],
        // Fase 3 (Última fase antes da vitória)
        3: [
            { value: 3, probability: 40, color: '#FFD700' }, // Amarelo
            { value: 4, probability: 40, color: '#FFA500' }, // Laranja
            { value: 5, probability: 20, color: '#FF0000' }  // Vermelho
        ],
        // Booster Explosivo (Fase final após completar todas as fases)
        explosive: [
            { value: 10, probability: 50, color: '#FFD700' }, // Dourado
            { value: 20, probability: 30, color: '#9400D3' }, // Roxo
            { value: 30, probability: 20, color: '#00FF00' }  // Verde
        ]
    },
    
    // Configurações de fases
    phases: [
        { 
            number: 1, 
            positions: 10, 
            minValue: 0, 
            maxValue: 9, 
            time: 30,
            requiredCorrectNumbers: 1 // Jogador precisa acertar apenas 1 número
        },
        { 
            number: 2, 
            positions: 7, 
            minValue: 0, 
            maxValue: 6, 
            time: 30,
            requiredCorrectNumbers: 1 // Jogador precisa acertar apenas 1 número
        },
        { 
            number: 3, 
            positions: 5, 
            minValue: 0, 
            maxValue: 4, 
            time: 30,
            requiredCorrectNumbers: 1, // Jogador precisa acertar apenas 1 número
            isBoosterPhase: true // Marca esta fase como a fase do Booster Explosivo
        }
    ],
    
    // Configuração da fase do Booster Explosivo
    explosivePhase: {
        positions: 3,
        minValue: 1,
        maxValue: 3,
        time: 30,
        requiredCorrectNumbers: 1
    },
    
    // Configurações de animações
    animations: {
        countdownDuration: 1000,
        phaseTransitionDuration: 2000,
        resultDuration: 6000,
        boosterPulseDuration: 1000
    }
};
