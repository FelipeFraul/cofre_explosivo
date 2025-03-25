/**
 * AudioManager class - Gerencia a reprodução de áudio com suporte a múltiplos dispositivos
 */
class AudioManager {
    constructor() {
        // Configuração inicial
        this.isInitialized = false;
        this.lastPlayedValue = null;
        
        // Web Audio API para música de fundo
        this.audioContext = null;
        this.musicBuffer = null;
        this.musicSource = null;
        this.musicGainNode = null;
        this.isMusicPlaying = false;
        this.loopInterval = null;
        this.loopOverlap = 0.05; // Overlap de 50ms para transição suave
        
        // Criar pool de elementos de áudio pré-carregados para resposta rápida
        this.audioPool = {
            click: [],
            countdown: [],
            success: []
        };
        
        // Criar elementos de áudio principais
        this.audioElements = {
            click: new Audio('sounds/click.mp3'),
            countdown: new Audio('sounds/countdown.mp3'),
            success: new Audio('sounds/success.mp3')
        };
        
        // Pré-carregar os sons
        Object.entries(this.audioElements).forEach(([name, audio]) => {
            audio.preload = 'auto';
            
            // Criar pool de 5 elementos de áudio para cada som
            for (let i = 0; i < 5; i++) {
                const clone = new Audio(audio.src);
                clone.preload = 'auto';
                clone.load(); // Forçar carregamento
                this.audioPool[name].push({
                    element: clone,
                    inUse: false
                });
            }
        });
        
        // Inicializar na primeira interação do usuário
        const events = ['click', 'touchstart', 'mousedown'];
        events.forEach(event => {
            document.addEventListener(event, () => this.initAudio(), { once: true });
        });
        
        // Tentar inicializar imediatamente para desktop
        setTimeout(() => {
            if (!this.isInitialized && !this.isMobileDevice()) {
                this.initAudio();
            }
        }, 100);
        
        console.log("AudioManager construído, aguardando inicialização");
    }
    
    /**
     * Verifica se é um dispositivo móvel
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Inicializa o sistema de áudio
     */
    initAudio() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            // Inicializar Web Audio API para música de fundo
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Criar o nó de ganho para controlar o volume
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.value = 0.15; // Volume inicial 15%
            this.musicGainNode.connect(this.audioContext.destination);
            
            // Pré-carregar o buffer da música
            this.loadMusicBuffer();
            
            console.log("AudioManager inicializado com Web Audio API");
            this.isInitialized = true;
        } catch (error) {
            console.error("Erro ao inicializar AudioManager:", error);
        }
    }
    
    /**
     * Carrega o buffer da música de fundo
     */
    loadMusicBuffer() {
        fetch('sounds/music.mp3')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao carregar música: ${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.musicBuffer = audioBuffer;
                console.log("Buffer de música carregado com sucesso");
            })
            .catch(error => {
                console.error("Erro ao carregar buffer de música:", error);
            });
    }
    
    /**
     * Obtém um elemento de áudio disponível do pool
     * @param {string} name - Nome do som
     * @returns {Object|null} - Objeto de áudio disponível ou null
     */
    getAudioFromPool(name) {
        if (!this.audioPool[name]) return null;
        
        // Procurar por um elemento não utilizado
        const available = this.audioPool[name].find(item => !item.inUse);
        if (available) {
            available.inUse = true;
            return available;
        }
        
        // Se todos estiverem em uso, criar um novo
        const newAudio = new Audio(this.audioElements[name].src);
        newAudio.preload = 'auto';
        
        const newItem = {
            element: newAudio,
            inUse: true
        };
        
        this.audioPool[name].push(newItem);
        return newItem;
    }
    
    /**
     * Reproduz um som com volume especificado
     * @param {string} name - Nome do som (click, countdown, success)
     * @param {number} volume - Nível de volume (0.0 a 1.0)
     * @param {number} value - O valor associado a este som (para evitar duplicatas)
     */
    playSound(name, volume = 1.0, value = null) {
        // Inicializar se ainda não estiver inicializado
        if (!this.isInitialized) {
            this.initAudio();
        }
        
        // Evitar reproduzir o mesmo som duas vezes seguidas para o mesmo valor
        if (value !== null && this.lastPlayedValue === value) return;
        this.lastPlayedValue = value;
        
        // Verificar se o som existe
        if (!this.audioElements[name]) {
            console.warn(`Som '${name}' não encontrado`);
            return;
        }
        
        try {
            // Obter elemento de áudio do pool
            const audioItem = this.getAudioFromPool(name);
            
            if (audioItem) {
                const audio = audioItem.element;
                
                // Resetar para garantir reprodução imediata
                audio.pause();
                audio.currentTime = 0;
                
                // Definir volume
                audio.volume = volume;
                
                // Reproduzir imediatamente
                const playPromise = audio.play();
                
                // Liberar o elemento após a reprodução
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            // Marcar como disponível após o término
                            audio.onended = () => {
                                audioItem.inUse = false;
                            };
                        })
                        .catch(error => {
                            // Liberar em caso de erro
                            audioItem.inUse = false;
                            console.error(`Erro ao reproduzir som '${name}':`, error);
                        });
                } else {
                    // Liberar após um tempo se não houver promessa
                    setTimeout(() => {
                        audioItem.inUse = false;
                    }, 500);
                }
                
                console.log(`Reproduzindo som '${name}' com volume ${volume}`);
            } else {
                // Fallback para elemento principal
                const audio = this.audioElements[name];
                audio.volume = volume;
                audio.currentTime = 0;
                audio.play().catch(error => {
                    console.error(`Erro ao reproduzir som '${name}' (fallback):`, error);
                });
            }
        } catch (error) {
            console.error(`Erro ao reproduzir som '${name}':`, error);
        }
    }
    
    /**
     * Inicia a reprodução da música de fundo
     */
    playBackgroundMusic() {
        if (!this.isInitialized) {
            this.initAudio();
            // Retornar e aguardar a próxima chamada quando o áudio estiver inicializado
            return;
        }
        
        // Se já estiver tocando, não faça nada
        if (this.isMusicPlaying) {
            return;
        }
        
        try {
            // Verificar se o buffer da música está carregado
            if (!this.musicBuffer) {
                console.log("Buffer de música ainda não carregado, tentando novamente em 500ms");
                setTimeout(() => this.playBackgroundMusic(), 500);
                return;
            }
            
            // Limpar qualquer intervalo existente
            if (this.loopInterval) {
                clearInterval(this.loopInterval);
            }
            
            // Obter a duração da música
            const duration = this.musicBuffer.duration;
            
            // Criar a primeira fonte de áudio
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = this.musicBuffer;
            this.musicSource.connect(this.musicGainNode);
            
            // Iniciar a reprodução
            const startTime = this.audioContext.currentTime;
            this.musicSource.start(startTime);
            this.isMusicPlaying = true;
            
            // Configurar o intervalo para iniciar uma nova fonte antes da atual terminar
            // Subtraímos o overlap para iniciar a próxima fonte um pouco antes
            const loopTime = (duration - this.loopOverlap) * 1000;
            
            this.loopInterval = setInterval(() => {
                if (!this.isMusicPlaying) {
                    clearInterval(this.loopInterval);
                    return;
                }
                
                // Criar uma nova fonte de áudio
                const nextSource = this.audioContext.createBufferSource();
                nextSource.buffer = this.musicBuffer;
                nextSource.connect(this.musicGainNode);
                
                // Iniciar a nova fonte
                nextSource.start(0);
                
                // Substituir a fonte atual pela nova
                this.musicSource = nextSource;
                
                console.log("Próxima iteração da música iniciada com overlap");
            }, loopTime);
            
            console.log("Música de fundo iniciada com loop manual (overlap de " + this.loopOverlap + "s)");
        } catch (error) {
            console.error("Erro ao iniciar música de fundo:", error);
        }
    }
    
    /**
     * Para a reprodução da música de fundo
     */
    stopBackgroundMusic() {
        if (this.isMusicPlaying) {
            try {
                // Limpar o intervalo de loop
                if (this.loopInterval) {
                    clearInterval(this.loopInterval);
                    this.loopInterval = null;
                }
                
                // Parar a fonte de áudio atual
                if (this.musicSource) {
                    this.musicSource.stop();
                    this.musicSource = null;
                }
                
                this.isMusicPlaying = false;
                console.log("Música de fundo parada");
            } catch (error) {
                console.error("Erro ao parar música de fundo:", error);
            }
        }
    }
}

// Criar uma instância global
window.audioManager = new AudioManager();
