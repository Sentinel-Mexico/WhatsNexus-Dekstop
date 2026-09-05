# Theme & Color Palette Categorization Rules 🎨

This document governs the creation, insertion, ordering, and categorization of visual theme color palettes in **WhatsNexus**.

---

## 1. Strict Category Hierarchy & Internal Alphabetical Ordering

The palette selection dropdown (`#palette-select` in `src/renderer/index.html`) and all related UI selectors must strictly adhere to the following 4-tier visual category hierarchy. **Every category must be ordered alphabetically internally:**

### Tier 1: Application Own Theme (Tema propio del programa)
* **WhatsNexus** (`whatsnexus`): Canonical default brand identity.

### Tier 2: Custom / Original Themes (Temas personalizados / originales) — *Sorted Alphabetically*
1. **Alto Contraste (Blanco y Negro)** (`highcontrast`)
2. **Bosque (Oliva y Tierra)** (`forest`)
3. **Dracula (Morado y Gris Oscuro)** (`dracula`)
4. **Nord (Hielo y Escarcha)** (`nord`)
5. **Retro (Beige y Neón)** (`retro`)
6. **Steampunk (Pergamino y Latón)** (`steampunk`)

### Tier 3: Messaging App Inspired Themes (Temas inspirados en mensajería) — *Sorted Alphabetically*
1. **Messenger (Azul Meta)** (`messenger`)
2. **Signal (Azul Real)** (`signal`)
3. **Telegram (Azul Cian)** (`telegram`)
4. **WhatsApp (Esmeralda)** (`whatsapp`)

### Tier 4: Pop Culture Themes (Temas de cultura pop) — *Sorted Alphabetically*
1. **Star Wars (Sable de Luz)** (`starwars`)

---

## 2. Mandatory Agent Insertion Rule (Strict Constraint)

When requested to add a new color palette or theme in future updates:
1. **Mandatory Category Placement:** The new palette **MUST OBLIGATORILY** be inserted within the block of the category to which it belongs:
   - *Application Own (Temas Propios):* Reserved exclusively for official WhatsNexus brand themes.
   - *Custom / Original (Temas Personalizados / Originales):* Original concepts, aesthetic styles, vintage, or high-contrast utility palettes.
   - *Messaging App (Temas Inspirados en Mensajería):* Themes inspired by messaging and chat platforms.
   - *Pop Culture (Temas de Cultura Pop):* Themes inspired by fictional franchises, media, cinema, or pop culture icons.
2. **Internal Alphabetical Insertion:** The new palette **MUST OBLIGATORILY** be inserted into its alphabetically sorted position within its designated category block. It must never be appended haphazardly at the end of the list or out of order.
3. **HTML & Dropdown Order:** The `<option>` tag inside `<select id="palette-select">` (`src/renderer/index.html`) must follow this exact category hierarchy and internal alphabetical placement.
4. **CSS Tokens & Design System:** Every new palette must define complete Light and Dark CSS tokens in `src/renderer/style.css` (e.g. `body.palette-<id>.theme-light` and `body.palette-<id>.theme-dark`).
5. **Dynamic Theme Switch Labels:** If the theme requires specialized Light/Dark switch labels (such as "Día/Noche" or "Jedi/Sith"), the agent must update `updateThemeLabels()` in `src/renderer/renderer.js`.
6. **100% i18n Localization Parity:** The palette label translation key (`palette_<id>`) and any custom switch labels (`theme_<id>_light`, `theme_<id>_dark`) must be translated and inserted across **all 55 supported locale JSON files** in `src/locales/` without English fallbacks, adhering strictly to [`rules/i18n.md`](i18n.md).
