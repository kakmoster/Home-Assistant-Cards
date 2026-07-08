# Home Assistant Cards

Custom Lovelace cards for Home Assistant.

## Cards

| Card | Description |
|------|-------------|
| `counter-card` | Interactive counter 0–10 for kids — auto-counting + floating numbers on tap |
| `emoji-pop-card` | Tap the screen → 1–5 random emojis pop up with numbers |

## Installation via HACS

1. Open HACS in Home Assistant
2. Click **⋮** (top-right menu) → **Custom repositories**
3. Paste: `https://github.com/kakmoster/Home-Assistant-Cards`
4. Category: **Lovelace**
5. Click **Add**
6. Go to **Frontend** tab → find **Home Assistant Cards** → **Install**
7. Restart Home Assistant

## Manual Installation

1. Download `counter-card.js` and `emoji-pop-card.js`
2. Place them in `www/community/home-assistant-cards/` in your config folder
3. Add to `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/community/home-assistant-cards/counter-card.js
      type: module
    - url: /local/community/home-assistant-cards/emoji-pop-card.js
      type: module
```

4. Restart Home Assistant

## Usage

```yaml
type: custom:counter-card
```

```yaml
type: custom:emoji-pop-card
```
