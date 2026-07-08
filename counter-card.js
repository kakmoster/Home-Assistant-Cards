// ================================================================
// counter-card.js — Custom Lovelace Card for HA
// Interactive 0–10 counter for kids, optimized for tablets.
// Creates floating numbers on tap + auto theme/number cycling.
// ================================================================

(function () {
  'use strict';

  // ================================================================
  // Color themes: each new round gets a random new theme.
  // bg = background gradient, colors = palette for floating numbers
  // ================================================================
  const THEMES = [
    {
      name: 'Blue',
      bg: 'linear-gradient(135deg, #e3f2fd 0%, #90caf9 50%, #bbdefb 100%)',
      colors: ['#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6'],
    },
    {
      name: 'Green',
      bg: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 50%, #c8e6c9 100%)',
      colors: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784'],
    },
    {
      name: 'Orange',
      bg: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 50%, #ffe0b2 100%)',
      colors: ['#E65100', '#F57C00', '#EF6C00', '#FF9800', '#FFA726', '#FFB74D'],
    },
    {
      name: 'Purple',
      bg: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 50%, #e1bee7 100%)',
      colors: ['#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#CE93D8'],
    },
    {
      name: 'Turquoise',
      bg: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 50%, #b2ebf2 100%)',
      colors: ['#006064', '#00838F', '#0097A7', '#00BCD4', '#26C6DA', '#4DD0E1'],
    },
    {
      name: 'Pink',
      bg: 'linear-gradient(135deg, #fce4ec 0%, #f48fb1 50%, #f8bbd0 100%)',
      colors: ['#880E4F', '#AD1457', '#C62828', '#E91E63', '#F06292', '#F48FB1'],
    },
    {
      name: 'Rainbow',
      bg: 'linear-gradient(135deg, #ffcdd2 0%, #fff9c4 25%, #c8e6c9 50%, #b3e5fc 75%, #e1bee7 100%)',
      colors: ['#e53935', '#fb8c00', '#43a047', '#1e88e5', '#8e24aa', '#00acc1'],
    },
  ];

  // ================================================================
  // MAIN COMPONENT — CounterCard
  // ================================================================
  class CounterCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // Internal state
      this._count = 0;                                // 0–10
      this._themeIndex = Math.floor(Math.random() * THEMES.length);
      this._floatingNumbers = [];                      // saved tap numbers
      this._timer = null;
      this._hintTimer = null;
    }

    // ----------------------------------------------------------------
    // Lovelace API — configuration
    // ----------------------------------------------------------------
    setConfig(config) {
      this._config = config;
    }

    // ----------------------------------------------------------------
    // Lifecycle — when the card is added to the DOM
    // ----------------------------------------------------------------
    connectedCallback() {
      this._render();
      this._startCounter();
      this._attachEvents();

      // Show hint text for 5 seconds, then hide
      this._hintTimer = setTimeout(() => {
        const hint = this.shadowRoot.getElementById('hint');
        if (hint) hint.classList.add('hint--hidden');
      }, 5000);
    }

    // ----------------------------------------------------------------
    // Lifecycle — when the card is removed from the DOM
    // ----------------------------------------------------------------
    disconnectedCallback() {
      this._stopCounter();
      this._detachEvents();
      if (this._hintTimer) clearTimeout(this._hintTimer);
    }

    // ----------------------------------------------------------------
    // Lovelace API — required for layout
    // ----------------------------------------------------------------
    getCardSize() {
      return 1;
    }

    // ----------------------------------------------------------------
    // Builds the entire DOM structure (runs once on mount)
    // ----------------------------------------------------------------
    _render() {
      const theme = THEMES[this._themeIndex];
      const shadow = this.shadowRoot;

      shadow.innerHTML = `
        <style>
          /* === Rounded, kid-friendly font from Google Fonts ===
             To drop the external dependency, remove the @import line
             below — fallback becomes the system font (Segoe UI / San Francisco). */
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

          /* === THE WHOLE CARD — fills the entire screen area === */
          .container {
            position: relative;
            width: 100%;
            height: 100vh;
            height: 100dvh;           /* dynamic viewport = good on Safari/Chrome mobile */
            background: ${theme.bg};
            background-size: 200% 200%;
            overflow: hidden;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Nunito', 'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif;
            animation: bgShift 8s ease-in-out infinite alternate;
            transition: opacity 0.5s ease;
          }

          /* === Slow gradient drift — gives the background life === */
          @keyframes bgShift {
            0%   { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }

          /* === MAIN COUNTER — big number in the middle === */
          .counter {
            position: relative;
            z-index: 2;
            font-size: min(40vw, 300px);
            font-weight: 900;
            color: ${theme.colors[0]};
            text-shadow: 2px 2px 0 rgba(255,255,255,0.3);
            line-height: 1;
            pointer-events: none;
            animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }

          /* === Zoom-in animation for the counter when the number changes === */
          @keyframes popIn {
            0%   { transform: scale(0.5); opacity: 0.2; }
            60%  { transform: scale(1.1); }
            100% { transform: scale(1);   opacity: 1; }
          }

          /* === CONTAINER FOR FLOATING NUMBERS (above the counter) === */
          .floating-container {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 3;
          }

          /* === SINGLE FLOATING NUMBER === */
          .floating-number {
            position: absolute;
            font-size: min(18vw, 130px);
            font-weight: 900;
            pointer-events: none;
            text-shadow: 1px 1px 0 rgba(255,255,255,0.4);
            animation:
              bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both,
              gentleFloat 4s ease-in-out infinite;
            animation-delay: 0s, 0.6s;
          }

          /* === Bounce + spin animation when a new number is created === */
          @keyframes bounceIn {
            0%   { transform: translate(-50%, -50%) scale(0)  rotate(-20deg); opacity: 0; }
            50%  { transform: translate(-50%, -50%) scale(1.4) rotate(8deg);  opacity: 1; }
            70%  { transform: translate(-50%, -50%) scale(0.9) rotate(-4deg); }
            100% { transform: translate(-50%, -50%) scale(1)   rotate(0deg);  opacity: 0.85; }
          }

          /* === Gentle bob so numbers don't sit completely still === */
          @keyframes gentleFloat {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50%      { transform: translate(-50%, -50%) translateY(-10px); }
          }

          /* === Fade out — number disappears softly === */
          @keyframes fadeOut {
            0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.85; }
            100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          }

          /* === HINT TEXT "Tap the screen!" at the bottom === */
          .hint {
            position: absolute;
            bottom: 6%;
            left: 50%;
            transform: translateX(-50%);
            font-size: min(4vw, 22px);
            font-weight: 700;
            color: rgba(0,0,0,0.25);
            z-index: 5;
            pointer-events: none;
            transition: opacity 0.8s ease;
          }
          .hint--hidden {
            opacity: 0;
          }

          /* === Soft fade-in on theme change (container re-applied) === */
          @keyframes fadeInContainer {
            0%   { opacity: 0.5; }
            100% { opacity: 1; }
          }
        </style>

        <div class="container" id="container">
          <div class="counter" id="counter">${this._count}</div>
          <div class="floating-container" id="floating-container"></div>
          <div class="hint" id="hint">👆 Tap the screen!</div>
        </div>
      `;
    }

    // ----------------------------------------------------------------
    // COUNTER — start the interval (every 5 seconds)
    // ----------------------------------------------------------------
    _startCounter() {
      this._timer = setInterval(() => {
        if (this._count >= 10) {
          // === ROUND IS OVER — restart from 0 with a new theme ===
          this._count = 0;
          this._themeIndex = (this._themeIndex + 1) % THEMES.length;
          this._floatingNumbers = [];               // clear all tapped numbers
          this._clearFloatingNumbers();
          this._applyTheme();                       // swap background + number color
          this._animateCounter();                   // show 0 with animation
        } else {
          this._count++;
          this._animateCounter();
        }
      }, 5000);
    }

    // ----------------------------------------------------------------
    // Stop the counter
    // ----------------------------------------------------------------
    _stopCounter() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    }

    // ----------------------------------------------------------------
    // Update only the number in the DOM (no full re-render)
    // ----------------------------------------------------------------
    _animateCounter() {
      const el = this.shadowRoot.getElementById('counter');
      if (!el) return;
      el.textContent = this._count;
      // Restart the pop animation
      el.style.animation = 'none';
      void el.offsetWidth;                          // force reflow
      el.style.animation = 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both';
    }

    // ----------------------------------------------------------------
    // Swap background and counter color when theme changes (no re-render)
    // ----------------------------------------------------------------
    _applyTheme() {
      const theme = THEMES[this._themeIndex];
      const container = this.shadowRoot.getElementById('container');
      const counter = this.shadowRoot.getElementById('counter');
      if (container) container.style.background = theme.bg;
      if (counter) counter.style.color = theme.colors[0];
    }

    // ----------------------------------------------------------------
    // Clear all floating numbers from the screen
    // ----------------------------------------------------------------
    _clearFloatingNumbers() {
      const c = this.shadowRoot.getElementById('floating-container');
      if (c) c.innerHTML = '';
    }

    // ----------------------------------------------------------------
    // CREATE A NEW FLOATING NUMBER on tap
    // clientX / clientY from pointer-event
    // ----------------------------------------------------------------
    _createFloatingNumber(clientX, clientY) {
      const container = this.shadowRoot.getElementById('floating-container');
      if (!container) return;

      // Cap the number of floating numbers so heavy tapping stays tidy
      const MAX_FLOATING = 5;
      while (container.children.length >= MAX_FLOATING) {
        container.removeChild(container.firstChild);
      }

      // Convert screen coords to percent within the card
      const rect = this.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      const value = this._count;   // current counter (not random)
      const theme = THEMES[this._themeIndex];
      const color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
      const rotation = Math.random() * 30 - 15;        // –15° to +15°

      // Save so the number can be recreated on a re-render
      this._floatingNumbers.push({ value, x, y, color, rotation });

      // Build DOM element
      const el = document.createElement('div');
      el.className = 'floating-number';
      el.textContent = value;
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.style.color = color;
      el.style.setProperty('--rot', rotation + 'deg');
      container.appendChild(el);

      // Remove the number after 3 seconds with animation
      setTimeout(() => {
        // First stop the running animations (bounceIn + gentleFloat)
        el.style.animation = 'none';
        void el.offsetWidth;  // force reflow
        // Start the fade-out animation via inline-style (no cache/quirk issue)
        el.style.animation = 'fadeOut 0.5s ease forwards';
        // Remove from saved numbers so it isn't recreated on theme change
        const idx = this._floatingNumbers.findIndex(
          n => n.value === value && Math.abs(n.x - x) < 0.01 && Math.abs(n.y - y) < 0.01
        );
        if (idx !== -1) this._floatingNumbers.splice(idx, 1);
        // Remove the DOM element after the animation completes
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }, 3000);
    }

    // ----------------------------------------------------------------
    // EVENT HANDLING — pointerdown for both mouse and touch
    // ----------------------------------------------------------------
    _attachEvents() {
      // pointerdown covers mouse + touch without 300ms delay
      this._boundPointer = (e) => {
        this._createFloatingNumber(e.clientX, e.clientY);

        // Hide hint after first tap
        const hint = this.shadowRoot.getElementById('hint');
        if (hint) hint.classList.add('hint--hidden');
      };

      this.addEventListener('pointerdown', this._boundPointer);
      this.addEventListener('selectstart', (e) => e.preventDefault());
      this.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _detachEvents() {
      if (this._boundPointer) {
        this.removeEventListener('pointerdown', this._boundPointer);
      }
    }
  }

  // ================================================================
  // REGISTER THE CARD
  // ================================================================
  customElements.define('counter-card', CounterCard);

  // Make the card searchable in Home Assistant's card picker
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'counter-card',
    name: 'Counter Card',
    description: 'Interactive 0–10 counter for kids',
  });
})();
