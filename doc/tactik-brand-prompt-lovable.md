# TACTIK — Brand & Design System Prompt
## À intégrer au prompt CTO Lovable

---

## 1. IDENTITÉ VISUELLE GÉNÉRALE

Tactik est un SaaS de coaching football amateur. L'interface doit évoquer la performance, la data sportive et la gamification — dans l'esprit de Football Manager et EA FC, avec la rigueur d'un outil professionnel comme Linear.

**Mode par défaut : Dark mode.**
Un toggle Light/Dark doit être disponible dans les paramètres utilisateur et persistent via localStorage.

---

## 2. TYPOGRAPHIE

### Font Display — Chaney Ultra Extended (Atipo Foundry)
Utilisée exclusivement pour les grands titres, scores, hero sections et éléments de marque.

```css
@font-face {
  font-family: 'Chaney';
  src: url('/fonts/ChaneyUltraExtended.woff2') format('woff2');
  font-weight: 900;
  font-display: swap;
}
```

**Règles d'usage Chaney :**
- Toujours en `text-transform: uppercase`
- `letter-spacing: 0.05em` minimum
- `line-height: 0.9` à `1.0` sur les grands formats
- Réservée aux : titres de page (H1), scores et chiffres hero, nom de marque dans le logo, landing page hero
- Jamais utilisée sous 20px
- Jamais en corps de texte, labels ou navigation

### Font UI — N27 Regular + Italic (Atipo Foundry)
Utilisée pour toute l'interface : navigation, labels, corps de texte, stats, tableaux.

```css
@font-face {
  font-family: 'N27';
  src: url('/fonts/N27-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'N27';
  src: url('/fonts/N27-Italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
```

**Règles d'usage N27 :**
- Taille minimale : 11px
- Corps de texte : 13–14px / `line-height: 1.6`
- Labels UI : 10–11px / `letter-spacing: 0.15em` / `text-transform: uppercase`
- Navigation : 13px / `font-weight: 400` (inactif) ou simuler medium via `-webkit-text-stroke: 0.3px` (actif)
- L'italic est utilisé pour les métadonnées secondaires et les annotations

### Scale typographique complète

```css
/* Dans index.css ou globals.css */
:root {
  --font-display: 'Chaney', 'Arial Black', sans-serif;
  --font-ui:      'N27', 'DM Sans', sans-serif;

  /* Tailles */
  --text-hero:   clamp(40px, 6vw, 72px);   /* Chaney — landing, scores */
  --text-h1:     clamp(28px, 4vw, 40px);   /* Chaney — titres de page */
  --text-h2:     clamp(18px, 2.5vw, 24px); /* Chaney — sous-titres section */
  --text-h3:     16px;                      /* N27 — titres de card */
  --text-body:   14px;                      /* N27 — corps */
  --text-small:  13px;                      /* N27 — secondaire */
  --text-label:  11px;                      /* N27 uppercase — labels */
  --text-micro:  10px;                      /* N27 — metadata */
}
```

---

## 3. COULEURS — DARK MODE (défaut)

### Architecture CSS Variables — OBLIGATOIRE
**Toutes les couleurs d'accent doivent passer par `--color-primary` et ses dérivées. Aucune valeur hexadécimale d'accent ne doit être hardcodée dans les composants.** Cette architecture permet la thématisation future par club (feature roadmap).

```css
/* ── globals.css ou index.css ── */
:root {
  /* Accent primaire — remplaçable par thème club */
  --color-primary:        #16FF6E;
  --color-primary-dim:    rgba(22, 255, 110, 0.12);
  --color-primary-glow:   rgba(22, 255, 110, 0.20);
  --color-primary-border: rgba(22, 255, 110, 0.18);
  --color-primary-text:   #000000; /* texte sur fond primary */

  /* Fonds — Dark mode */
  --bg-base:      #0A0D0F; /* fond global */
  --bg-surface-1: #111518; /* sidebar, panels */
  --bg-surface-2: #181E22; /* cards, modals */
  --bg-surface-3: #1D2429; /* hover states, inputs */

  /* Texte */
  --text-primary:   #EEF2EF;
  --text-secondary: #667A70;
  --text-muted:     #2D3D35;
  --text-disabled:  #1F2E28;

  /* Bordures */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong:  rgba(255, 255, 255, 0.16);

  /* États sémantiques — fixes, jamais remplacés par thème club */
  --color-success: #16FF6E;  /* = primary en thème par défaut */
  --color-warning: #FFD60A;
  --color-danger:  #FF3B30;
  --color-info:    #4F8EFF;

  /* Chimie FUT — sémantique fixe, JAMAIS modifiée par thème club */
  --chem-optimal: #16FF6E;
  --chem-good:    #FFD60A;
  --chem-weak:    #FF8C00;
  --chem-bad:     #FF3B30;

  /* Rayons */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* Spacing base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}

/* ── Light mode ── */
[data-theme="light"] {
  --bg-base:      #F4F6F4;
  --bg-surface-1: #FFFFFF;
  --bg-surface-2: #F0F2F0;
  --bg-surface-3: #E8EDE9;

  --text-primary:   #0D1410;
  --text-secondary: #4A6055;
  --text-muted:     #8BA898;
  --text-disabled:  #C4D4CE;

  --border-subtle:  rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.10);
  --border-strong:  rgba(0, 0, 0, 0.16);

  /* Primary reste identique en light — ajuster si trop flashy */
  --color-primary:        #0FCC58; /* légèrement plus sombre pour contraste sur blanc */
  --color-primary-dim:    rgba(15, 204, 88, 0.10);
  --color-primary-glow:   rgba(15, 204, 88, 0.16);
  --color-primary-border: rgba(15, 204, 88, 0.20);
  --color-primary-text:   #FFFFFF;
}
```

---

## 4. LAYOUT & NAVIGATION

### Desktop (≥ 1024px) — Sidebar gauche fixe

```
┌─────────────────────────────────────────┐
│  Sidebar 220px fixe  │  Main content    │
│  bg: --bg-surface-1  │  bg: --bg-base   │
│                      │                  │
│  [Logo TACTIK·]      │  [Page title H1] │
│                      │                  │
│  > Dashboard         │  [Content area]  │
│  > Composition FUT   │                  │
│  > Joueurs           │                  │
│  > Statistiques      │                  │
│  > Matchs            │                  │
│  ──────────────────  │                  │
│  > Entraînements     │                  │
│  > Amendes           │                  │
│  > Communication     │                  │
│                      │                  │
│  [Team card bas]     │                  │
└─────────────────────────────────────────┘
```

**Sidebar specs :**
- Largeur : 220px fixe, non-collapsible en v1
- `position: fixed; left: 0; top: 0; height: 100vh`
- Logo : Chaney 18px uppercase + dot primaire avec glow
- Nav items : N27 13px, gap 2px entre items
- Item actif : `background: --color-primary-dim; color: --color-primary; border: 1px solid --color-primary-border; border-radius: --radius-md`
- Section labels : N27 9px, `letter-spacing: 0.25em`, `text-transform: uppercase`, `color: --text-muted`
- Team card en bas : fond `--bg-surface-2`, border `--border-subtle`, nom en Chaney 13px

### Mobile (< 1024px) — Bottom navigation bar

```
┌─────────────────────────────────────────┐
│  [Page content — full width]            │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠    ⚡FUT    👥    📊    📅          │
│ Home  Compo  Joueurs Stats Agenda       │
└─────────────────────────────────────────┘
```

**Bottom bar specs :**
- `position: fixed; bottom: 0; width: 100%`
- Hauteur : 64px + `padding-bottom: env(safe-area-inset-bottom)`
- Fond : `--bg-surface-1` avec `backdrop-filter: blur(12px)`
- 5 items max : Dashboard, Composition, Joueurs, Stats, Agenda
- Item actif : icône + label en `--color-primary`
- Item inactif : icône seule en `--text-muted`
- Border top : `1px solid --border-subtle`

---

## 5. COMPOSANTS CLÉS

### Nav Item (sidebar)
```tsx
// Inactif
className="flex items-center gap-2.5 px-3 py-2 rounded-lg 
           text-[--text-secondary] text-[13px] font-[family-name:var(--font-ui)]
           hover:bg-[--bg-surface-3] hover:text-[--text-primary] 
           transition-all duration-150 cursor-pointer"

// Actif
className="flex items-center gap-2.5 px-3 py-2 rounded-lg
           text-[--color-primary] text-[13px] font-[family-name:var(--font-ui)]
           bg-[--color-primary-dim] border border-[--color-primary-border]"
```

### Stat Card
```tsx
className="bg-[--bg-surface-1] border border-[--border-subtle] 
           rounded-xl p-4"
// Valeur : Chaney pour les scores hero, N27 semibold pour les stats UI
// Label : N27 10px uppercase letter-spacing-wide text-[--text-muted]
```

### Badge FUT
```tsx
className="font-[family-name:var(--font-ui)] text-[9px] font-bold 
           tracking-widest uppercase px-1.5 py-0.5 rounded
           bg-[--color-primary] text-[--color-primary-text]"
```

### Bouton primaire
```tsx
className="font-[family-name:var(--font-ui)] text-[11px] font-semibold
           tracking-wider uppercase px-4 py-2 rounded-lg
           bg-[--color-primary] text-[--color-primary-text]
           hover:opacity-90 active:scale-[0.98] transition-all"
```

### Score / Chimie globale (hero number)
```tsx
// Valeur : Chaney, taille hero, couleur primary
// Dénominateur : N27, taille réduite, text-muted
<span className="font-[family-name:var(--font-display)] 
                 text-6xl uppercase tracking-tight 
                 text-[--color-primary]">87</span>
<span className="font-[family-name:var(--font-ui)] 
                 text-xl text-[--text-muted]">/100</span>
```

---

## 6. LIGNES DE CHIMIE FUT

Les connexions entre joueurs sur le terrain interactif utilisent exclusivement ces couleurs, indépendamment du thème club :

```ts
// utils/chemistry.ts
export const CHEMISTRY_COLORS = {
  optimal: 'var(--chem-optimal)', // #16FF6E
  good:    'var(--chem-good)',    // #FFD60A
  weak:    'var(--chem-weak)',    // #FF8C00
  bad:     'var(--chem-bad)',     // #FF3B30
} as const;

// Épaisseur des lignes selon le niveau
export const CHEMISTRY_STROKE = {
  optimal: 2.5,
  good:    2.0,
  weak:    1.8,
  bad:     2.0, // légèrement plus épais pour signaler le problème
} as const;

// Opacité
export const CHEMISTRY_OPACITY = {
  optimal: 0.85,
  good:    0.75,
  weak:    0.70,
  bad:     0.80,
} as const;
```

---

## 7. EFFETS VISUELS

### Glow sur accent primaire
```css
/* Dot logo, éléments actifs, scores importants */
.glow-primary {
  box-shadow: 0 0 12px var(--color-primary-glow),
              0 0 24px var(--color-primary-dim);
}

/* Texte (scores FUT hero uniquement) */
.glow-text-primary {
  text-shadow: 0 0 20px var(--color-primary-glow);
}
```

### Fond gradient subtil (landing, auth screens)
```css
.bg-gradient-hero {
  background: 
    radial-gradient(ellipse 60% 50% at 15% 40%, rgba(22,255,110,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 60%, rgba(22,100,255,0.04) 0%, transparent 70%),
    var(--bg-base);
}
```

### Noise texture (optionnel sur les surfaces hero)
```css
.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.03;
  pointer-events: none;
}
```

### Transitions globales
```css
* {
  transition-property: color, background-color, border-color, opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 8. TAILWIND CONFIG

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Chaney', 'Arial Black', 'sans-serif'],
        ui:      ['N27', 'DM Sans', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
        'primary-dim': 'var(--color-primary-dim)',
        'bg-base':      'var(--bg-base)',
        'bg-surface-1': 'var(--bg-surface-1)',
        'bg-surface-2': 'var(--bg-surface-2)',
        'bg-surface-3': 'var(--bg-surface-3)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'chem-optimal':   'var(--chem-optimal)',
        'chem-good':      'var(--chem-good)',
        'chem-weak':      'var(--chem-weak)',
        'chem-bad':       'var(--chem-bad)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
} satisfies Config
```

---

## 9. DARK/LIGHT TOGGLE — IMPLÉMENTATION

```tsx
// hooks/useTheme.ts
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('tactik-theme') as Theme) ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tactik-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle }
}
```

---

## 10. CHARGEMENT DES FONTS

Les fichiers `.woff2` des fonts Atipo Foundry doivent être placés dans `/public/fonts/` :
- `ChaneyUltraExtended.woff2`
- `N27-Regular.woff2`
- `N27-Italic.woff2`

```html
<!-- index.html — preload critique -->
<link rel="preload" href="/fonts/ChaneyUltraExtended.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/N27-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 11. RÈGLES ABSOLUES À NE PAS DÉROGER

1. **Aucune valeur hexadécimale d'accent hardcodée dans les composants** — tout passe par `var(--color-primary)` et ses dérivées.
2. **Chaney uniquement pour les H1, scores et éléments de marque** — jamais en navigation, labels ou corps de texte.
3. **Les 4 couleurs de chimie FUT sont sémantiques et fixes** — elles ne changent jamais avec le thème club.
4. **Dark mode est le défaut** — `data-theme="dark"` sur `<html>` si aucune préférence stockée.
5. **Le layout desktop est sidebar gauche 220px fixe** — pas de topbar, pas de sidebar collapsible en v1.
6. **Le layout mobile est bottom navigation** — jamais de hamburger menu en mobile.
7. **Toutes les transitions UI : 150ms** — pas de 300ms ni de 500ms sauf animations d'entrée de page.

---

*Prompt rédigé par Antoine Monie / Nexxia — Design direction validée le 30/03/2026*
*Fonts : Chaney Ultra Extended + N27 Regular/Italic — Atipo Foundry (atipofoundry.com)*
