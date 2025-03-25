/**
 * RotaryDial class - Manages the rotary dial interface
 */
class RotaryDial {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.dial = document.getElementById('rotary-dial');
        this.knob = document.getElementById('dial-knob');
        this.indicator = document.getElementById('dial-indicator');
        this.markers = document.getElementById('dial-markers');
        this.valueDisplay = document.getElementById('selected-value-display');
        this.proximityIndicator = document.getElementById('proximity-indicator');
        
        // Merge default options with provided options
        this.options = Object.assign({
            positions: 10,
            minValue: 0,
            maxValue: 9,
            phase: 1
        }, options);
        
        this.currentAngle = 0;
        this.currentValue = 0;
        this.isDragging = false;
        this.centerX = 0;
        this.centerY = 0;
        this.highlights = [];
        this.correctValue = null;
        
        this.init();
    }
    
    /**
     * Initialize the rotary dial
     */
    init() {
        this.createMarkers();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    /**
     * Create markers and labels around the dial
     */
    createMarkers() {
        // Clear existing markers
        this.markers.innerHTML = '';
        this.highlights = [];
        
        const positions = this.options.positions;
        const angleStep = 360 / positions;
        
        for (let i = 0; i < positions; i++) {
            const angle = i * angleStep;
            const value = (i + this.options.minValue) % positions;
            
            // Create marker
            const marker = document.createElement('div');
            marker.className = 'dial-marker';
            marker.style.transform = `rotate(${angle}deg) translateX(-50%)`;
            this.markers.appendChild(marker);
            
            // Create label
            const label = document.createElement('div');
            label.className = 'dial-label';
            label.textContent = value;
            
            // Calculate position
            const labelRadius = this.dial.clientWidth * 0.38;
            const labelAngleRad = (angle - 90) * (Math.PI / 180);
            const labelX = Math.cos(labelAngleRad) * labelRadius;
            const labelY = Math.sin(labelAngleRad) * labelRadius;
            
            label.style.left = `calc(50% + ${labelX}px)`;
            label.style.top = `calc(50% + ${labelY}px)`;
            this.markers.appendChild(label);
            
            // Create highlight for this position
            const highlight = document.createElement('div');
            highlight.className = 'dial-highlight';
            highlight.dataset.value = value;
            highlight.style.left = `calc(50% + ${labelX}px)`;
            highlight.style.top = `calc(50% + ${labelY}px)`;
            this.markers.appendChild(highlight);
            this.highlights.push(highlight);
        }
    }
    
    /**
     * Set up event listeners for the dial
     */
    setupEventListeners() {
        // Mouse events
        this.dial.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Touch events
        this.dial.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));
        
        // Prevent context menu on long press
        this.dial.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Handle start of interaction (mousedown/touchstart)
     * @param {Event} e - The event object
     */
    handleStart(e) {
        e.preventDefault();
        
        const rect = this.dial.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        
        this.isDragging = true;
        this.handleMove(e);
    }
    
    /**
     * Handle movement during interaction (mousemove/touchmove)
     * @param {Event} e - The event object
     */
    handleMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        // Get coordinates
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        // Calculate angle
        const deltaX = clientX - this.centerX;
        const deltaY = clientY - this.centerY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Convert to 0-360 range
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;
        
        this.setAngle(angle);
    }
    
    /**
     * Handle end of interaction (mouseup/touchend)
     */
    handleEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        // Snap to nearest position
        this.snapToNearestPosition();
    }
    
    /**
     * Set the dial angle
     * @param {number} angle - The angle in degrees
     */
    setAngle(angle) {
        this.currentAngle = angle;
        this.indicator.style.transform = `rotate(${angle}deg)`;
        
        // Calculate value based on angle
        const positions = this.options.positions;
        const angleStep = 360 / positions;
        const value = Math.round(angle / angleStep) % positions;
        
        if (this.currentValue !== value) {
            this.currentValue = value;
            this.updateDisplay();
            this.checkCorrectValue();
            this.updateProximityIndicator();
        }
    }
    
    /**
     * Snap the dial to the nearest position
     */
    snapToNearestPosition() {
        const positions = this.options.positions;
        const angleStep = 360 / positions;
        const targetAngle = Math.round(this.currentAngle / angleStep) * angleStep;
        
        this.setAngle(targetAngle);
    }
    
    /**
     * Update the value display
     */
    updateDisplay() {
        if (this.valueDisplay) {
            this.valueDisplay.textContent = this.currentValue;
        }
    }
    
    /**
     * Update the proximity indicator based on how close we are to the correct value
     */
    updateProximityIndicator() {
        if (!this.proximityIndicator || this.correctValue === null) return;
        
        // Remover todas as classes de proximidade
        this.proximityIndicator.classList.remove('proximity-high', 'proximity-medium', 'proximity-low');
        
        // Calcular a distância ao valor correto
        const distance = Math.abs(this.currentValue - this.correctValue);
        
        // Definir a classe de proximidade com base na distância
        if (distance === 0) {
            this.proximityIndicator.classList.add('proximity-high');
        } else if (distance === 1) {
            this.proximityIndicator.classList.add('proximity-medium');
        } else if (distance === 2) {
            this.proximityIndicator.classList.add('proximity-low');
        }
    }
    
    /**
     * Check if the current value is the correct one
     */
    checkCorrectValue() {
        if (this.correctValue !== null && this.currentValue === this.correctValue) {
            this.highlightValue(this.currentValue);
        }
    }
    
    /**
     * Highlight a specific value on the dial
     * @param {number} value - The value to highlight
     */
    highlightValue(value) {
        // Remove any existing highlights
        this.highlights.forEach(highlight => {
            highlight.classList.remove('active');
        });
        
        // Find and activate the highlight for this value
        const highlight = this.highlights.find(h => parseInt(h.dataset.value) === value);
        if (highlight) {
            highlight.classList.add('active');
        }
    }
    
    /**
     * Set the correct value that should trigger feedback
     * @param {number} value - The correct value
     */
    setCorrectValue(value) {
        this.correctValue = value;
        // Atualizar o indicador de proximidade imediatamente
        this.updateProximityIndicator();
    }
    
    /**
     * Update the dial configuration for a new phase
     * @param {Object} options - The new options
     */
    updateConfig(options) {
        this.options = Object.assign(this.options, options);
        this.createMarkers();
        this.currentValue = 0;
        this.currentAngle = 0;
        this.indicator.style.transform = `rotate(0deg)`;
        this.updateDisplay();
        
        // Resetar o indicador de proximidade
        if (this.proximityIndicator) {
            this.proximityIndicator.classList.remove('proximity-high', 'proximity-medium', 'proximity-low');
        }
    }
    
    /**
     * Get the current selected value
     * @returns {number} The current value
     */
    getValue() {
        return this.currentValue;
    }
    
    /**
     * Reset the dial to its initial state
     */
    reset() {
        this.currentAngle = 0;
        this.currentValue = 0;
        this.indicator.style.transform = `rotate(0deg)`;
        this.updateDisplay();
        
        // Remove any highlights
        this.highlights.forEach(highlight => {
            highlight.classList.remove('active');
        });
        
        // Resetar o indicador de proximidade
        if (this.proximityIndicator) {
            this.proximityIndicator.classList.remove('proximity-high', 'proximity-medium', 'proximity-low');
        }
    }
}
