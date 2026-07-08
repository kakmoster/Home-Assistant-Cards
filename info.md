---
name: Home Assistant Cards
description: Anpassade Lovelace-kort för Home Assistant — counter-card och emoji-pop-card
---

# 🏠 Home Assistant Cards

En samling av anpassade Lovelace-kort byggda av Ludvig.

## 🃏 Kort

### counter-card
En interaktiv räknare 0–10 för småbarn, optimerad för surfplatta.
- Räknar automatiskt 0 → 10 var 5:e sekund
- Byter färgtema vid varje omgång (7 teman)
- Tryck på skärmen för att skapa flytande siffror (visar aktuell siffra)
- Max 5 flytande siffror samtidigt (ingen röra vid mycket klickande)

**Användning:**
```yaml
type: custom:counter-card
```

### emoji-pop-card
Ett roligt kort som poppar upp emojis när du trycker på skärmen.
- Tryck → 1–5 slumpmässiga emojis med siffror
- 7 färgteman med gradient-bakgrund
- Perfekt för att engagera småbarn

**Användning:**
```yaml
type: custom:emoji-pop-card
```

## 📦 Installation

1. Lägg till detta repo som en **Custom repository** i HACS (kategori: Lovelace)
2. Installera **Home Assistant Cards** från Frontend-fliken
3. Starta om Home Assistant

Se [README.md](README.md) för fullständiga instruktioner (inkl. manuell installation).
