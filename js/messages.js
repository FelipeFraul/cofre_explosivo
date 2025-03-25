/**
 * Mensagens de incentivo para o jogador em diferentes fases do jogo
 */
window.GameMessages = {
    // Frases para a fase 1
    phase1Win: [
        "Ouça com atenção\npara abrir o cofre!"
    ],
    
    // Frases para a fase 1 quando perde
    phase1Loss: [
        "O cofre explodiu... mas você pode tentar de novo!",
        "Ajuste a estratégia e tente outra vez!",
        "Não desista! O segredo do cofre ainda pode ser seu!"
    ],
    
    // Frases para a fase 2 quando ganha
    phase2Win: [
        "Incrível! O cofre está quase abrindo!",
        "Nada pode te parar! O cofre está prestes a ceder!",
        "Sua estratégia está funcionando! Continue!"
    ],
    
    // Frases para a fase 2 quando perde
    phase2Loss: [
        "Foi por pouco! O cofre explodiu!",
        "Nada de desânimo! Existem outros cofres para abrir!",
        "O cofre explodiu, mas o próximo pode ser o seu!"
    ],
    
    // Frases para a fase final quando ganha
    phase3Win: [
        "Mais uma escolha correta e todo dinheiro será seu!",
        "Respire fundo e concentre-se ao máximo!",
        "Escute o botão girar. O som é seu aliado!"
    ],
    
    // Frases para a fase final quando perde
    phase3Loss: [
        "Por um triz... o cofre explodiu!",
        "Faltou só um detalhe! Tente um novo cofre!",
        "Essa foi por pouco! Volte e tente um cofre novo!"
    ],
    
    // Frases para a fase booster explosivo quando ganha
    explosiveBoosterWin: [
        "Você conseguiu! A fortuna é sua!",
        "Parabéns! Você desvendou o segredo do cofre",
        "Que demais! Cofre aberto e dinheiro garantido!"
    ],
    
    // Frases para a fase booster explosivo quando perde
    explosiveBoosterLoss: [
        "O cofre explodiu… e levou seu prêmio junto! Que pena!",
        "Foi por pouco! Um novo cofre te espera",
        "Coragem não faltou! Agora é respirar fundo e tentar novamente!"
    ],
    
    // Frases para a página do booster explosivo
    explosiveBoosterPrompt: [
        "Vai parar agora? O grande prêmio te espera!",
        "Seu saldo pode explodir! Continue jogando!",
        "Multiplique ainda mais! O risco vale a pena!"
    ],
    
    /**
     * Obtém uma mensagem aleatória de uma categoria específica
     * @param {string} category - Categoria da mensagem
     * @returns {string} - Mensagem aleatória
     */
    getRandomMessage: function(category) {
        if (!this[category] || !this[category].length) {
            console.error(`Categoria de mensagem '${category}' não encontrada`);
            return "";
        }
        
        const randomIndex = Math.floor(Math.random() * this[category].length);
        return this[category][randomIndex];
    }
};
