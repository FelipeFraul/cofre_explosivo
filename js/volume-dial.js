/**
 * VolumeDial class - Manages the volume dial interface
 */
class VolumeDial {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        
        // Merge default options with provided options
        this.options = Object.assign({
            positions: 11, // Aumentado para 11 para incluir a posição neutra
            minValue: 0,
            maxValue: 9,
            phase: 1,
            volume: 0,
            label: "Volume",
            correctNumbers: []
        }, options);
        
        // Valores possíveis, com '-' na posição inicial
        this.values = ['-', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        this.currentAngle = 0;
        this.currentValue = '-'; // Valor inicial é '-'
        this.isDragging = false;
        this.centerX = 0;
        this.centerY = 0;
        this.correctValue = null;
        this.valueDisplay = null;
        this.confirmButton = null;
        this.dotElements = [];
        
        // Angle settings
        this.minAngle = -135;
        this.maxAngle = 135;
        this.angleSpan = this.maxAngle - this.minAngle;
        
        // Audio settings - use AudioManager instead of direct Audio API
        this.lastPlayedValue = null;
        
        this.init();
    }
    
    /**
     * Initialize the volume dial
     */
    init() {
        this.createDialStructure();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateConfirmButton();
        
        // Iniciar na posição neutra (extremo inicial do dial)
        this.reset();
    }
    
    /**
     * Create the dial structure
     */
    createDialStructure() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'volume__content';
        
        // Create control div
        const controlDiv = document.createElement('div');
        controlDiv.className = 'volume__control';
        
        // Create wrap div
        const wrapDiv = document.createElement('div');
        wrapDiv.className = 'volume__dial-wrap';
        
        // Create dial button
        this.dialKnob = document.createElement('button');
        this.dialKnob.className = 'volume__dial';
        this.dialKnob.setAttribute('aria-label', this.options.label);
        
        // Create label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'volume__dial-label';
        labelSpan.textContent = this.options.label;
        this.dialKnob.appendChild(labelSpan);
        
        // Create dots
        this.createDots(controlDiv);
        
        // Add elements to control div
        controlDiv.appendChild(wrapDiv);
        controlDiv.appendChild(this.dialKnob);
        
        // Add control div to content div
        contentDiv.appendChild(controlDiv);
        
        // Create value display
        this.valueDisplay = document.createElement('div');
        this.valueDisplay.id = 'selected-value-display';
        
        // Create confirm button
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'dial-controls';
        
        this.confirmButton = document.createElement('button');
        this.confirmButton.id = 'confirm-value';
        this.confirmButton.textContent = 'CONFIRMAR';
        this.confirmButton.disabled = false;
        this.confirmButton.addEventListener('click', () => this.confirmValue());
        
        // Add all elements to container
        this.container.appendChild(contentDiv);
        this.container.appendChild(this.valueDisplay);
        this.container.appendChild(controlsDiv);
        
        // Add phase-specific class
        this.container.className = `volume volume--phase${this.options.phase}`;
        
        // Set initial rotation - começar em uma posição que é claramente a posição neutra
        const startAngle = this.minAngle - 5; // Bem antes do primeiro ponto
        this.setAngle(startAngle);
    }
    
    /**
     * Create dots around the dial
     * @param {HTMLElement} controlDiv - The control div to append dots to
     */
    createDots(controlDiv) {
        this.dotElements = [];
        
        // Determinar o número de posições baseado nos valores mínimo e máximo
        const minValue = this.options.minValue;
        const maxValue = this.options.maxValue;
        const numPositions = maxValue - minValue + 1;
        
        // Calcular o ângulo para cada setor do dial
        // Ajustamos para que o primeiro ponto (0) não esteja muito próximo da posição neutra
        const dotSectorAngle = this.angleSpan / (numPositions - 1);
        const dotSectorAngleOffset = -this.angleSpan / 2;
        
        // Criar pontos para cada valor possível (minValue até maxValue)
        for (let i = 0; i < numPositions; i++) {
            const angle = dotSectorAngle * i + dotSectorAngleOffset;
            const dotDiv = document.createElement('div');
            dotDiv.className = 'volume__dot';
            dotDiv.style.transform = `rotate(${angle}deg)`;
            
            // Associar o valor numérico ao dot
            const value = minValue + i;
            dotDiv.dataset.value = value;
            
            controlDiv.appendChild(dotDiv);
            this.dotElements.push(dotDiv);
        }
    }
    
    /**
     * Set up event listeners for the dial
     */
    setupEventListeners() {
        // Event listeners will be set up after the dial is added to the DOM
        setTimeout(() => {
            this.dialKnob = document.querySelector('.volume__dial');
            if (!this.dialKnob) return;
            
            // Initialize draggable
            this.initDraggable();
            
            // Add click listener to confirm button
            if (this.confirmButton) {
                this.confirmButton.addEventListener('click', () => {
                    this.confirmValue();
                });
            }
        }, 0);
    }
    
    /**
     * Initialize the draggable functionality
     */
    initDraggable() {
        if (!this.dialKnob) return;
        
        let isDragging = false;
        let startAngle = 0;
        let currentAngle = 0;
        
        const getAngle = (e) => {
            const rect = this.dialKnob.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            if (clientX === undefined || clientY === undefined) return 0;
            
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            // Convert to -180 to 180 range
            angle = angle + 90; // Adjust to make top 0 degrees
            if (angle > 180) angle -= 360;
            
            // Clamp to min/max angles
            return Math.max(this.minAngle, Math.min(this.maxAngle, angle));
        };
        
        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
            startAngle = getAngle(e);
            this.dialKnob.style.cursor = 'grabbing';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            currentAngle = getAngle(e);
            this.setAngle(currentAngle);
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            this.dialKnob.style.cursor = 'grab';
            this.snapToNearestPosition();
        };
        
        // Mouse events
        this.dialKnob.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        // Touch events
        this.dialKnob.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        
        // Prevent context menu on long press
        this.dialKnob.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        this.dialKnob.addEventListener('keydown', (e) => {
            const up = e.code === "ArrowUp" || e.code === "ArrowRight";
            const down = e.code === "ArrowDown" || e.code === "ArrowLeft";
            
            if (up || down) {
                e.preventDefault();
                
                const minValue = this.options.minValue;
                const maxValue = this.options.maxValue;
                const numPositions = maxValue - minValue + 1;
                
                const currentTick = Math.round(((this.currentAngle - this.minAngle) / this.angleSpan) * (numPositions - 1));
                
                if (up) {
                    const newTick = Math.min(numPositions - 1, currentTick + 1);
                    const newAngle = this.minAngle + (newTick / (numPositions - 1)) * this.angleSpan;
                    this.setAngle(newAngle);
                } else if (down) {
                    const newTick = Math.max(0, currentTick - 1);
                    const newAngle = this.minAngle + (newTick / (numPositions - 1)) * this.angleSpan;
                    this.setAngle(newAngle);
                }
            }
        });
    }
    
    /**
     * Set the dial angle
     * @param {number} angle - The angle in degrees
     */
    setAngle(angle) {
        this.currentAngle = angle;
        
        if (this.dialKnob) {
            this.dialKnob.style.transform = `rotate(${angle}deg)`;
        }
        
        // Determinar o número de posições baseado nos valores mínimo e máximo
        const minValue = this.options.minValue;
        const maxValue = this.options.maxValue;
        const numPositions = maxValue - minValue + 1;
        
        // Calcular o valor baseado no ângulo
        const normalizedAngle = (angle - this.minAngle) / this.angleSpan;
        
        // Verificar se estamos na posição neutra (apenas quando o ângulo é menor que o mínimo)
        const isNeutral = angle < this.minAngle;
        
        let newValue;
        if (isNeutral) {
            newValue = '-';
        } else {
            // Calcular o índice do valor
            const valueIndex = Math.round(normalizedAngle * (numPositions - 1));
            // Garantir que o índice esteja dentro dos limites
            const clampedIndex = Math.max(0, Math.min(valueIndex, numPositions - 1));
            // Converter para o valor real
            newValue = minValue + clampedIndex;
        }
        
        // Reproduzir o som ANTES de atualizar o valor
        // Isso antecipa a reprodução do som para reduzir a percepção de delay
        if (this.currentValue !== newValue) {
            // Play sound BEFORE updating the value (only for numeric values)
            if (newValue !== '-') {
                this.playDialSound(newValue);
            }
            
            // Atualizar o valor e a interface depois
            this.currentValue = newValue;
            this.updateDisplay();
            this.updateDots();
            this.checkCorrectValue();
            this.updateConfirmButton();
        }
    }
    
    /**
     * Play the dial sound with appropriate volume
     * @param {number} valueToPlay - The value to play sound for (can be different from current value)
     */
    playDialSound(valueToPlay) {
        // Use the provided value or current value
        const soundValue = (valueToPlay !== undefined) ? valueToPlay : this.currentValue;
        
        // Avoid playing the same sound twice in a row
        if (this.lastPlayedValue === soundValue) return;
        this.lastPlayedValue = soundValue;
        
        // Check if the current value is a correct number
        const isCorrectNumber = this.options.correctNumbers && 
                               this.options.correctNumbers.includes(soundValue);
        
        // Set volume based on phase and correctness
        let volume = 0.3; // Base volume for non-correct numbers
        
        if (isCorrectNumber) {
            // Adjust volume based on phase
            switch(this.options.phase) {
                case 1:
                    volume = 0.9; // 3x louder
                    break;
                case 2:
                    volume = 0.6; // 2x louder
                    break;
                case 3:
                    volume = 0.45; // 1.5x louder
                    break;
                case 4: // Booster Explosivo
                    volume = 0.35; // 0.5x louder
                    break;
                default:
                    volume = 0.3;
            }
        }
        
        // Use AudioManager to play the sound
        if (window.audioManager) {
            window.audioManager.playSound('click', volume, soundValue);
        } else {
            console.warn("AudioManager not available");
        }
    }
    
    /**
     * Snap the dial to the nearest position
     */
    snapToNearestPosition() {
        // Se estamos na posição neutra, não fazer snap
        if (this.currentAngle < this.minAngle) {
            return;
        }
        
        const minValue = this.options.minValue;
        const maxValue = this.options.maxValue;
        const numPositions = maxValue - minValue + 1;
        
        const normalizedAngle = (this.currentAngle - this.minAngle) / this.angleSpan;
        const snappedNormalizedAngle = Math.round(normalizedAngle * (numPositions - 1)) / (numPositions - 1);
        const snappedAngle = this.minAngle + (snappedNormalizedAngle * this.angleSpan);
        
        this.setAngle(snappedAngle);
    }
    
    /**
     * Update the dots based on current value
     */
    updateDots() {
        const minValue = this.options.minValue;
        
        // Se o valor atual for '-', não preencha nenhum dot
        if (this.currentValue === '-') {
            this.dotElements.forEach(dot => {
                dot.classList.remove('volume__dot--filled');
            });
            return;
        }
        
        // Para valores numéricos, preencha até o valor atual
        const currentValue = Number(this.currentValue);
        
        this.dotElements.forEach((dot, index) => {
            // Calcular o valor real deste dot
            const dotValue = minValue + index;
            
            // Preencher dots até o valor atual
            if (dotValue <= currentValue) {
                dot.classList.add('volume__dot--filled');
            } else {
                dot.classList.remove('volume__dot--filled');
            }
        });
    }
    
    /**
     * Update the value display
     */
    updateDisplay() {
        if (this.valueDisplay) {
            // Se for a posição neutra, exibir "-"
            if (this.currentValue === '-') {
                this.valueDisplay.textContent = '-';
                this.valueDisplay.classList.add('neutral-value');
            } else {
                this.valueDisplay.textContent = this.currentValue;
                this.valueDisplay.classList.remove('neutral-value');
            }
        }
    }
    
    /**
     * Atualiza o estado do botão de confirmação
     */
    updateConfirmButton() {
        if (this.confirmButton) {
            if (this.currentValue === '-') {
                this.confirmButton.disabled = true;
                this.confirmButton.textContent = 'ESCOLHA UM NÚMERO';
            } else {
                this.confirmButton.disabled = false;
                this.confirmButton.textContent = 'CONFIRMAR';
            }
        }
    }
    
    /**
     * Check if the current value is the correct one
     */
    checkCorrectValue() {
        // Não verificar se estiver na posição neutra
        if (this.currentValue === '-') return;
        
        if (this.options.correctNumbers && this.options.correctNumbers.includes(this.currentValue)) {
            // Dispara evento de valor correto encontrado (sem áudio)
            const feedbackEvent = new CustomEvent('correctValueFound', {
                detail: { value: this.currentValue }
            });
            document.dispatchEvent(feedbackEvent);
        }
    }
    
    /**
     * Confirm the current value
     */
    confirmValue() {
        // Não permitir confirmação se estiver na posição neutra
        if (this.currentValue === '-') return;
        
        const confirmEvent = new CustomEvent('valueConfirmed', {
            detail: { value: this.currentValue }
        });
        document.dispatchEvent(confirmEvent);
    }
    
    /**
     * Set a specific value
     * @param {number|string} value - The value to set
     */
    setValue(value) {
        // Se for a posição neutra
        if (value === '-') {
            const angle = this.minAngle - 5; // Bem antes do primeiro ponto
            this.setAngle(angle);
            return;
        }
        
        // Para valores numéricos
        const minValue = this.options.minValue;
        const maxValue = this.options.maxValue;
        const numPositions = maxValue - minValue + 1;
        
        const valueIndex = value - minValue;
        if (valueIndex >= 0 && valueIndex < numPositions) {
            const normalizedValue = valueIndex / (numPositions - 1);
            const angle = this.minAngle + (normalizedValue * this.angleSpan);
            this.setAngle(angle);
        }
    }
    
    /**
     * Update the dial configuration for a new phase
     * @param {Object} options - The new options
     */
    updateConfig(options) {
        this.options = Object.assign(this.options, options);
        this.createDialStructure();
        this.setupEventListeners();
        this.updateConfirmButton();
    }
    
    /**
     * Get the current selected value
     * @returns {number|null} The current value or null if in neutral position
     */
    getValue() {
        return this.currentValue === '-' ? null : this.currentValue;
    }
    
    /**
     * Reset the dial to its initial state
     */
    reset() {
        // Definir um ângulo que garanta a posição neutra
        const neutralAngle = this.minAngle - 5; // Bem antes do primeiro ponto
        this.setAngle(neutralAngle);
    }
    
    /**
     * Reinicia o dial para a posição inicial
     */
    resetDial() {
        // Reinicia para a posição bottom (-180 graus)
        this.currentAngle = -180;
        this.currentValue = '-';
        
        // Atualiza a rotação do dial
        if (this.dialKnob) {
            this.dialKnob.style.transform = `rotate(${this.currentAngle}deg)`;
        }
        
        // Atualiza o display
        this.updateDisplay();
        
        // Desativa o botão de confirmar
        if (this.confirmButton) {
            this.confirmButton.disabled = true;
            this.confirmButton.textContent = 'ESCOLHA UM NÚMERO';
        }
        
        // Atualiza os pontos indicadores
        this.updateDots();
        
        console.log("Dial reiniciado para a posição inicial");
    }
}
