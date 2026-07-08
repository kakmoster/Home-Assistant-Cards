# Home Assistant Cards

Anpassade Lovelace-kort för Home Assistant, byggda av Ludvig.

## Kort

| Kort | Beskrivning |
|------|-------------|
| `counter-card` | Interaktiv räknare 0–10 för småbarn — automatisk räkning + flytande siffror vid tryck |
| `emoji-pop-card` | Tryck på skärmen → 1–5 slumpmässiga emojis poppar upp med siffror |

## Installation via HACS

1. Öppna HACS i Home Assistant
2. Klicka på **⋮** (menyn uppe till höger) → **Custom repositories**
3. Klistra in: `https://github.com/kakmoster/Home-Assistant-Cards`
4. Välj kategori: **Lovelace**
5. Klicka **Add**
6. Gå till **Frontend**-fliken → hitta **Home Assistant Cards** → **Install**
7. Starta om Home Assistant

## Manuell installation

1. Ladda ner `counter-card.js` och `emoji-pop-card.js`
2. Lägg dem i `www/community/home-assistant-cards/` i din config-mapp
3. Lägg till i `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/community/home-assistant-cards/counter-card.js
      type: module
    - url: /local/community/home-assistant-cards/emoji-pop-card.js
      type: module
```

4. Starta om Home Assistant

## Användning

```yaml
type: custom:counter-card
```

```yaml
type: custom:emoji-pop-card
```
