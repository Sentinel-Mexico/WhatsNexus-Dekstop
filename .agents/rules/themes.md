# Theme & Color Palette Categorization Rules 🎨

This document governs the creation, insertion, ordering, and categorization of visual theme color palettes in **WhatsNexus**.

---

## 1. Strict Category Hierarchy

The palette selection dropdown (`#palette-select` in `src/renderer/index.html`) and all related UI selectors must strictly adhere to the following 4-tier visual category hierarchy:

### Tier 1: Application Own Theme (Tema propio del programa)
* **WhatsNexus** (`whatsnexus`): Canonical default brand identity.

### Tier 2: Custom / Original Themes (Temas personalizados / originales)
* **Bosque (Oliva y Tierra)** (`forest`)
* **Retro (Beige y Neón)** (`retro`)
* **Steampunk (Pergamino y Latón)** (`steampunk`)
* **Alto Contraste (Blanco y Negro)** (`highcontrast`)
* **Dracula (Morado y Gris Oscuro)** (`dracula`)
* **Nord (Hielo y Escarcha)** (`nord`)

### Tier 3: Messaging App Inspired Themes (Temas inspirados en mensajería)
* **WhatsApp (Esmeralda)** (`whatsapp`)
* **Messenger (Azul Meta)** (`messenger`)
* **Telegram (Azul Cian)** (`telegram`)
* **Signal (Azul Real)** (`signal`)

### Tier 4: Pop Culture Themes (Temas de cultura pop)
* **Star Wars (Sable de Luz)** (`starwars`)

---

## 2. Mandatory Agent Insertion Rule (Strict Constraint)

When requested to add a new color palette or theme in future updates:
1. **Mandatory Category Placement:** The new palette **MUST OBLIGATORILY** be inserted within the block of the category to which it belongs:
   - *Application Own:* Reserved exclusively for official WhatsNexus brand themes.
   - *Custom / Original:* Original concepts, aesthetic styles, vintage, or high-contrast utility palettes.
   - *Messaging App:* Themes inspired by messaging and chat platforms.
   - *Pop Culture:* Themes inspired by fictional franchises, media, cinema, or pop culture icons.
2. **HTML & Dropdown Order:** The `<option>` tag must be placed inside `<select id="palette-select">` strictly inside its designated category block, preserving the exact 4-tier sequence above.
3. **CSS Tokens & Design System:** Every new palette must define complete Light and Dark CSS tokens in `src/renderer/style.css` (e.g. `body.palette-<id>.theme-light` and `body.palette-<id>.theme-dark`).
4. **Dynamic Theme Switch Labels:** If the theme requires specialized Light/Dark switch labels (such as "Día/Noche" or "Jedi/Sith"), the agent must update `updateThemeLabels()` in `src/renderer/renderer.js`.
5. **100% i18n Localization Parity:** The palette label translation key (`palette_<id>`) and any custom switch labels (`theme_<id>_light`, `theme_<id>_dark`) must be translated and inserted across **all 55 supported locale JSON files** in `src/locales/` without English fallbacks, adhering strictly to [`rules/i18n.md`](i18n.md).
