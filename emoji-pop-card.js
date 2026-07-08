// ================================================================
// emoji-pop-card.js — Custom Lovelace Card for HA
// Tap the screen → 1–5 of the same emoji + number.
// Display time: 3+count seconds. Then 1s cooldown.
// ================================================================

(function () {
  'use strict';

  // ================================================================
  // EMOJIS — categorized for variety
  // ================================================================
  const EMOJI_POOL = [
    // Fruit & berries
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍑', '🍒',
    // Animals
    '🐱', '🐶', '🐰', '🐼', '🐨', '🦊', '🐸', '🐵', '🦁', '🐯', '🐹', '🐻',
    // Nature
    '🌸', '🌻', '🌺', '🌷', '🌼', '🪷', '🌈', '⭐', '🌟', '☀️',
    // Misc
    '🎈', '🎉', '🎊', '🎀', '🦋', '🐝', '🐞', '🐢', '🐟', '🐬', '🦄',
  ];

  // ================================================================
  // COLOR THEMES — background gradients
  // ================================================================
  const THEMES = [
    {
      name: 'Blue Dream',
      bg: 'linear-gradient(135deg, #e3f2fd 0%, #90caf9 50%, #bbdefb 100%)',
    },
    {
      name: 'Sunny',
      bg: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 50%, #ffecb3 100%)',
    },
    {
      name: 'Meadow',
      bg: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 50%, #c8e6c9 100%)',
    },
    {
      name: 'Lavender',
      bg: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 50%, #e1bee7 100%)',
    },
    {
      name: 'Sunset',
      bg: 'linear-gradient(135deg, #fff3e0 0%, #ffab91 50%, #fce4ec 100%)',
    },
    {
      name: 'Ocean',
      bg: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 50%, #b2ebf2 100%)',
    },
    {
      name: 'Rainbow',
      bg: 'linear-gradient(135deg, #ffcdd2 0%, #fff9c4 25%, #c8e6c9 50%, #b3e5fc 75%, #e1bee7 100%)',
    },
  ];

  // ================================================================
  // MAIN COMPONENT — EmojiPopCard
  // ================================================================
  class EmojiPopCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._themeIndex = Math.floor(Math.random() * THEMES.length);
      this._locked = false;         // lock so only 1 tap at a time
      this._unlockTimer = null;
      this._fadeTimer = null;
    }

    // ----------------------------------------------------------------
    // Lovelace API
    // ----------------------------------------------------------------
    setConfig(config) {
      this._config = config;
    }

    connectedCallback() {
      this._render();
      this._attachEvents();
    }

    disconnectedCallback() {
      this._detachEvents();
      if (this._unlockTimer) clearTimeout(this._unlockTimer);
      if (this._fadeTimer) clearTimeout(this._fadeTimer);
    }

    getCardSize() {
      return 1;
    }

    // ----------------------------------------------------------------
    // Compute display time based on emoji count
    // ----------------------------------------------------------------
    _displayTimeMs(count) {
      return (3 + count) * 1000;   // 1 = 4s, 5 = 8s
    }

    // ----------------------------------------------------------------
    // Pick a random emoji from the pool
    // ----------------------------------------------------------------
    _pickOneEmoji() {
      return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
    }

    // ----------------------------------------------------------------
    // DOM — render once on mount
    // ----------------------------------------------------------------
    _render() {
      const theme = THEMES[this._themeIndex];
      const shadow = this.shadowRoot;

      shadow.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

          :host {
            display: block;
            width: 100%;
            height: 100%;
          }

          .container {
            position: relative;
            width: 100%;
            height: 100vh;
            height: 100dvh;
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
            animation: bgShift 10s ease-in-out infinite alternate;
            transition: background 0.8s ease;
          }

          @keyframes bgShift {
            0%   { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }

          /* === Welcome text before first tap === */
          .welcome {
            position: relative;
            z-index: 2;
            text-align: center;
            pointer-events: none;
            transition: opacity 0.6s ease;
          }
          .welcome--hidden {
            opacity: 0;
          }
          .welcome-emoji {
            font-size: min(20vw, 120px);
            display: block;
            margin-bottom: 0.2em;
            animation: welcomeBob 2s ease-in-out infinite;
          }
          @keyframes welcomeBob {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-12px); }
          }
          .welcome-text {
            font-size: min(5vw, 28px);
            font-weight: 800;
            color: rgba(0,0,0,0.25);
          }

          /* === Container for emojis and numbers === */
          .pop-container {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 3;
          }

          /* === Single emoji pop === */
          .pop-group {
            position: absolute;
            transform: translate(-50%, -50%);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: min(1.5vw, 10px);
            max-width: min(60vw, 400px);
            pointer-events: none;
            animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }

          @keyframes popIn {
            0%   { transform: translate(-50%, -50%) scale(0);  opacity: 0; }
            60%  { transform: translate(-50%, -50%) scale(1.15); }
            100% { transform: translate(-50%, -50%) scale(1);  opacity: 1; }
          }

          /* === Single emoji === */
          .emoji {
            font-size: min(12vw, 80px);
            line-height: 1;
            display: inline-block;
            animation: emojiBob 0.8s ease-in-out infinite alternate;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          }

          .emoji:nth-child(odd)  { animation-duration: 0.7s; }
          .emoji:nth-child(3n)   { animation-duration: 0.9s; }
          .emoji:nth-child(5n)   { animation-duration: 1.1s; }

          @keyframes emojiBob {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-8px); }
          }

          /* === Number badge — round bubble with the count === */
          .number-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: min(10vw, 64px);
            height: min(10vw, 64px);
            padding: 0 min(2vw, 12px);
            border-radius: 999px;
            background: #e53935;
            color: #fff;
            font-size: min(7vw, 44px);
            font-weight: 900;
            box-shadow: 0 3px 12px rgba(229, 57, 53, 0.4);
            animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }

          @keyframes badgePop {
            0%   { transform: scale(0); }
            60%  { transform: scale(1.25); }
            100% { transform: scale(1); }
          }

          /* === Fade-out animation when emojis disappear === */
          .pop-group.fade-out {
            animation: fadeOut 0.6s ease forwards !important;
          }

          @keyframes fadeOut {
            0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) translateY(-40px); }
          }

          /* === Cooldown indicator — subtle dot at the bottom === */
          .status-dot {
            position: absolute;
            bottom: 5%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 5;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: min(1.5vw, 10px);
          }
          .dot {
            width: min(3vw, 16px);
            height: min(3vw, 16px);
            border-radius: 50%;
            background: #4caf50;
            transition: background 0.3s, transform 0.3s;
          }
          .dot--locked {
            background: #ff5252;
            animation: dotPulse 0.8s ease-in-out infinite;
          }
          @keyframes dotPulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50%      { transform: scale(1.3); opacity: 1; }
          }
          .status-label {
            font-size: min(2.5vw, 14px);
            font-weight: 700;
            color: rgba(0,0,0,0.25);
            transition: color 0.3s;
          }
          .status-label--locked {
            color: #ff5252;
          }

          /* === Theme switch button (subtle) === */
          .theme-btn {
            position: absolute;
            top: 2%;
            right: 2%;
            z-index: 10;
            background: rgba(255,255,255,0.3);
            border: none;
            border-radius: 50%;
            width: min(10vw, 48px);
            height: min(10vw, 48px);
            font-size: min(5vw, 24px);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            transition: background 0.2s;
            backdrop-filter: blur(4px);
          }
          .theme-btn:hover {
            background: rgba(255,255,255,0.5);
          }
          .theme-btn:active {
            transform: scale(0.9);
          }
        </style>

        <div class="container" id="container">
          <div class="welcome" id="welcome">
            <span class="welcome-emoji">🎉</span>
            <span class="welcome-text">Tap the screen!</span>
          </div>
          <div class="pop-container" id="pop-container"></div>
          <div class="status-dot" id="status-dot">
            <span class="dot" id="dot"></span>
            <span class="status-label" id="status-label">ready</span>
          </div>
          <button class="theme-btn" id="theme-btn" title="Change color theme">
            🎨
          </button>
        </div>
      `;
    }

    // ----------------------------------------------------------------
    // CREATE A POP — 1–5 of the SAME emoji + number
    // ----------------------------------------------------------------
    _createPop(clientX, clientY) {
      if (this._locked) return;
      this._locked = true;
      this._setStatus('locked');

      const container = this.shadowRoot.getElementById('pop-container');
      if (!container) return;

      // Coordinates in percent
      const rect = this.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      // Random 1–5
      const count = Math.floor(Math.random() * 5) + 1;

      // Pick ONE emoji — all become the same ("four cats")
      const chosenEmoji = this._pickOneEmoji();

      // Create group
      const group = document.createElement('div');
      group.className = 'pop-group';
      group.style.left = x + '%';
      group.style.top = y + '%';

      // Add count copies of the same emoji
      for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.className = 'emoji';
        span.textContent = chosenEmoji;
        group.appendChild(span);
      }

      // Add number badge
      const badge = document.createElement('span');
      badge.className = 'number-badge';
      badge.textContent = count;
      group.appendChild(badge);

      container.appendChild(group);

      // Hide welcome text after first tap
      const welcome = this.shadowRoot.getElementById('welcome');
      if (welcome) welcome.classList.add('welcome--hidden');

      // === TIMING ===
      const displayMs = this._displayTimeMs(count);

      // Fade out after displayMs
      this._fadeTimer = setTimeout(() => {
        group.classList.add('fade-out');
        group.addEventListener('animationend', () => {
          if (group.parentNode) group.remove();
        }, { once: true });
      }, displayMs);

      // Unlock: displayMs + fade time (600ms) + 1s cooldown
      this._unlockTimer = setTimeout(() => {
        this._locked = false;
        this._setStatus('ready');
      }, displayMs + 600 + 1000);
    }

    // ----------------------------------------------------------------
    // STATUS — update the small indicator at the bottom
    // ----------------------------------------------------------------
    _setStatus(state) {
      const dot = this.shadowRoot.getElementById('dot');
      const label = this.shadowRoot.getElementById('status-label');
      if (!dot || !label) return;
      if (state === 'locked') {
        dot.classList.add('dot--locked');
        label.classList.add('status-label--locked');
        label.textContent = 'wait…';
      } else {
        dot.classList.remove('dot--locked');
        label.classList.remove('status-label--locked');
        label.textContent = 'ready';
      }
    }

    // ----------------------------------------------------------------
    // CYCLE THEME
    // ----------------------------------------------------------------
    _cycleTheme() {
      this._themeIndex = (this._themeIndex + 1) % THEMES.length;
      const container = this.shadowRoot.getElementById('container');
      if (container) {
        container.style.background = THEMES[this._themeIndex].bg;
      }
    }

    // ----------------------------------------------------------------
    // EVENTS
    // ----------------------------------------------------------------
    _attachEvents() {
      this._boundPointer = (e) => {
        this._createPop(e.clientX, e.clientY);
      };

      this._boundTheme = () => {
        this._cycleTheme();
      };

      this.addEventListener('pointerdown', this._boundPointer);
      this.addEventListener('selectstart', (e) => e.preventDefault());
      this.addEventListener('contextmenu', (e) => e.preventDefault());

      const themeBtn = this.shadowRoot.getElementById('theme-btn');
      if (themeBtn) {
        themeBtn.addEventListener('click', this._boundTheme);
      }
    }

    _detachEvents() {
      if (this._boundPointer) {
        this.removeEventListener('pointerdown', this._boundPointer);
      }
      const themeBtn = this.shadowRoot.getElementById('theme-btn');
      if (themeBtn && this._boundTheme) {
        themeBtn.removeEventListener('click', this._boundTheme);
      }
    }
  }

  // ================================================================
  // REGISTER
  // ================================================================
  customElements.define('emoji-pop-card', EmojiPopCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'emoji-pop-card',
    name: 'Emoji Pop',
    description: 'Tap for 1–5 of the same emoji + number — learn to count!',
  });
})();
