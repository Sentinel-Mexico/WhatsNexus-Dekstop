# Theme & Color Palette Rules 🎨

This document governs the creation, insertion, ordering, validation, and categorization of visual theme color palettes in **WhatsNexus**.

---

## 1. Category Hierarchy & Visual Grouping

The palette selection dropdown (`#palette-select` in `src/renderer/index.html`) is populated dynamically via `buildPaletteDropdown()` and organizes themes into 5 structured visual categories separated by non-interactive symmetric headers (`-- Categoría --`):

1. **Tier 1: Tema Principal (`own`)**
   - Header: `Tema Principal` (displayed in uppercase via CSS `text-transform: uppercase`)
   - Exclusively reserved for official WhatsNexus brand identity (`whatsnexus`).
2. **Tier 2: Temas Personalizados (`custom`)**
   - Header: `Temas Personalizados`
   - Curated original built-in themes (e.g., `highcontrast`, `forest`, `cybernexus`, `dracula`, `nord`, `retro`, `steampunk`).
3. **Tier 3: Aplicaciones de Mensajería (`messaging`)**
   - Header: `Aplicaciones de Mensajería`
   - Themes inspired by major messaging clients (e.g., `messenger`, `signal`, `telegram`, `whatsapp`).
4. **Tier 4: Cultura Pop (`pop_culture`)**
   - Header: `Cultura Pop`
   - Themes inspired by media franchises, games, and pop culture (e.g., `doom`, `startrek`, `starwars`, `voxel`).
5. **Tier 5: Comunidad (`community`)**
   - Header: `Comunidad`
   - External, community-contributed, or third-party themes.

*Note:* The user's live custom palette is presented in its own dedicated trailing category: `Personalización Usuario` (`custom`).

### Internal Alphabetical Ordering
**Every category must be sorted alphabetically internally** based on the theme's localized name for the current language. The dynamic dropdown renderer (`buildPaletteDropdown()`) enforces this ordering automatically at runtime.

---

## 2. Category Access Control & Security

In `src/main.js`, the startup scanner (`load-themes`) enforces category authorization:
- Only built-in whitelisted palettes are permitted to claim Tier 1 (`own`) or Tier 2 (`custom`).
- Any external or unwhitelisted JSON theme attempting to declare `own` or `custom` is defensively and automatically demoted to `community` (Tier 5).

---

## 3. Theme File Structure (`src/themes/<id>.json`)

All themes are defined as individual, modular JSON files located in `src/themes/`. **Never hardcode theme styles in `src/renderer/style.css`.**

Each theme file must strictly follow this JSON schema:

```json
{
  "id": "mytheme",
  "nameKey": "palette_mytheme",
  "category": "custom",
  "builtin": true,
  "labels": {
    "light": "Nombre Modo Claro",
    "dark": "Nombre Modo Oscuro"
  },
  "modes": {
    "light": {
      "--bg-primary": "#FFFFFF",
      "--bg-sidebar": "#F0F4F8",
      "--bg-hover": "#E2E8F0",
      "--bg-modal": "#FFFFFF",
      "--whatsapp-bg": "#EBF3ED",
      "--text-primary": "#1E293B",
      "--text-secondary": "#64748B",
      "--border-color": "#CBD5E1",
      "--text-on-accent": "#FFFFFF",
      "--bg-active": "#06B6D4",
      "--accent-hover": "#0891B2",
      "--accent-secondary": "#0284C7",
      "--accent-terracotta": "#D97706",
      "--accent-crimson": "#E11D48"
    },
    "dark": {
      "--bg-primary": "#0B1120",
      "--bg-sidebar": "#0F172A",
      "--bg-hover": "#1E293B",
      "--bg-modal": "#0F172A",
      "--whatsapp-bg": "#070D18",
      "--text-primary": "#F8FAFC",
      "--text-secondary": "#94A3B8",
      "--border-color": "#1E293B",
      "--text-on-accent": "#FFFFFF",
      "--bg-active": "#22D3EE",
      "--accent-hover": "#06B6D4",
      "--accent-secondary": "#38BDF8",
      "--accent-terracotta": "#F59E0B",
      "--accent-crimson": "#F43F5E"
    }
  }
}
```

### Derived Tokens
The runtime engine automatically computes derived variables (`--bg-surface`, `--text-color`, `--accent-color`, `--whatsapp-green`, `--whatsapp-green-hover`, `--bg-modal-overlay`), so they do not need to be duplicated inside the JSON file.

---

## 4. Mandatory Workflow for Adding a New Theme

When instructed to add a new theme or color palette:

1. **Create the Theme JSON:**
   - Create `src/themes/<id>.json` conforming to the JSON schema.
   - Assign the proper `category` (`own`, `custom`, `messaging`, `pop_culture`, or `community`).
   - Define custom or generic switch labels in `labels.light` and `labels.dark` (do **NOT** hardcode labels in `renderer.js`).
2. **Do Not Touch `style.css` for Tokens:**
   - The theme engine injects tokens directly into `:root` via `document.documentElement.style.setProperty()` at runtime.
3. **100% i18n Parity Across All 55 Languages:**
   - The key declared in `nameKey` (e.g. `palette_<id>`) must be inserted across **all 55 JSON files** in `src/locales/` without English fallbacks, adhering strictly to [`rules/i18n.md`](i18n.md).
4. **Validation:**
   - Verify that the new JSON file parses without error (`node -e "JSON.parse(fs.readFileSync('src/themes/<id>.json'))"`).
   - Verify that `load-themes` in `main.js` loads the new theme without triggering a warning.
