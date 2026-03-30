# Tactik Coach — Prompt de lancement Lovable

> Fichier de référence pour le développement frontend avec Lovable.
> Dernière mise à jour : 30/03/2026

---

Tu vas développer "Tactik Coach" (app.tactik.coach), un ERP SaaS pour entraîneurs
de football amateur belge. React + TypeScript connecté à Supabase.

## Stack technique
- Frontend : React + TypeScript
- Backend : Supabase (déjà configuré)
- Auth : Supabase Auth (email + OAuth Google)
- Paiements : Stripe (déjà configuré)
- Emails : Resend (déjà configuré)
- UI : Tailwind CSS + shadcn/ui

---

## DESIGN SYSTEM — RÈGLES ABSOLUES

### Identité visuelle
Tactik évoque la performance, la data sportive et la gamification —
dans l'esprit de Football Manager et EA FC, avec la rigueur de Linear.
Dark mode par défaut. Toggle Dark/Light persistant via localStorage.

---

### Typographie

#### Font Display — Chaney Ultra Extended
Fichier : /public/fonts/ChaneyUltraExtended.woff2

```css
@font-face {
  font-family: 'Chaney';
  src: url('/fonts/ChaneyUltraExtended.woff2') format('woff2');
  font-weight: 900;
  font-display: swap;
}
```

Règles Chaney :
- TOUJOURS text-transform: uppercase
- letter-spacing: 0.05em minimum
- line-height: 0.9 à 1.0 sur grands formats
- Uniquement pour : H1, scores hero, nom de marque logo, landing hero
- JAMAIS sous 20px
- JAMAIS en navigation, labels ou corps de texte

#### Font UI — N27 Regular + Italic
Fichiers : /public/fonts/N27-Regular.woff2 + N27-Italic.woff2

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

Règles N27 :
- Taille minimale : 11px
- Corps de texte : 13-14px / line-height: 1.6
- Labels UI : 10-11px / letter-spacing: 0.15em / uppercase
- Navigation : 13px
- Italic : métadonnées secondaires et annotations

#### Scale typographique

```css
:root {
  --font-display: 'Chaney', 'Arial Black', sans-serif;
  --font-ui:      'N27', 'DM Sans', sans-serif;
  --text-hero:   clamp(40px, 6vw, 72px);
  --text-h1:     clamp(28px, 4vw, 40px);
  --text-h2:     clamp(18px, 2.5vw, 24px);
  --text-h3:     16px;
  --text-body:   14px;
  --text-small:  13px;
  --text-label:  11px;
  --text-micro:  10px;
}
```

#### Preload fonts dans index.html
```html
<link rel="preload" href="/fonts/ChaneyUltraExtended.woff2"
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/N27-Regular.woff2"
      as="font" type="font/woff2" crossorigin>
```

---

### Couleurs — CSS Variables OBLIGATOIRES

Aucune valeur hexadécimale d'accent hardcodée dans les composants.
Tout passe par var(--color-primary) et ses dérivées.
Cette architecture permet la thématisation future par club.

```css
:root {
  /* Accent primaire — remplaçable par thème club */
  --color-primary:        #16FF6E;
  --color-primary-dim:    rgba(22, 255, 110, 0.12);
  --color-primary-glow:   rgba(22, 255, 110, 0.20);
  --color-primary-border: rgba(22, 255, 110, 0.18);
  --color-primary-text:   #000000;

  /* Fonds Dark mode */
  --bg-base:      #0A0D0F;
  --bg-surface-1: #111518;
  --bg-surface-2: #181E22;
  --bg-surface-3: #1D2429;

  /* Texte */
  --text-primary:   #EEF2EF;
  --text-secondary: #667A70;
  --text-muted:     #2D3D35;
  --text-disabled:  #1F2E28;

  /* Bordures */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong:  rgba(255, 255, 255, 0.16);

  /* Sémantique — fixes, jamais remplacés par thème club */
  --color-success: #16FF6E;
  --color-warning: #FFD60A;
  --color-danger:  #FF3B30;
  --color-info:    #4F8EFF;

  /* Chimie FUT — JAMAIS modifiés par thème club */
  --chem-optimal: #16FF6E;
  --chem-good:    #FFD60A;
  --chem-weak:    #FF8C00;
  --chem-bad:     #FF3B30;

  /* Rayons */
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px;
}

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
  --color-primary:        #0FCC58;
  --color-primary-dim:    rgba(15, 204, 88, 0.10);
  --color-primary-glow:   rgba(15, 204, 88, 0.16);
  --color-primary-border: rgba(15, 204, 88, 0.20);
  --color-primary-text:   #FFFFFF;
}
```

---

### Tailwind Config

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
        primary:        'var(--color-primary)',
        'primary-dim':  'var(--color-primary-dim)',
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

### Effets visuels

```css
.glow-primary {
  box-shadow: 0 0 12px var(--color-primary-glow),
              0 0 24px var(--color-primary-dim);
}

.glow-text-primary {
  text-shadow: 0 0 20px var(--color-primary-glow);
}

.bg-gradient-hero {
  background:
    radial-gradient(ellipse 60% 50% at 15% 40%, rgba(22,255,110,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 60%, rgba(22,100,255,0.04) 0%, transparent 70%),
    var(--bg-base);
}

* {
  transition-property: color, background-color, border-color, opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

### Dark/Light Toggle

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

### Layout Desktop (≥ 1024px) — Sidebar gauche fixe 220px

- position: fixed; left: 0; top: 0; height: 100vh
- Largeur : 220px fixe, non-collapsible en v1
- bg: --bg-surface-1
- Logo : Chaney 18px uppercase + dot primaire avec glow
- Nav items : N27 13px, gap 2px
- Item actif : bg --color-primary-dim, color --color-primary,
  border 1px solid --color-primary-border, radius --radius-md
- Section labels : N27 9px, letter-spacing 0.25em, uppercase, color --text-muted
- Team card en bas : bg --bg-surface-2, border --border-subtle, nom Chaney 13px

Menu sidebar :
- Dashboard
- Composition FUT ⚡
- Joueurs
- Statistiques
- Matchs
- ── séparateur ──
- Entraînements
- Amendes
- Communication
- ── séparateur ──
- Admin (club_admin uniquement)
- [Team card + profil utilisateur en bas]

### Layout Mobile (< 1024px) — Bottom navigation bar

- position: fixed; bottom: 0; width: 100%
- Hauteur : 64px + padding-bottom: env(safe-area-inset-bottom)
- bg: --bg-surface-1, backdrop-filter: blur(12px)
- Border top : 1px solid --border-subtle
- 5 items : Dashboard / Composition / Joueurs / Stats / Agenda
- Item actif : icône + label en --color-primary
- Item inactif : icône seule en --text-muted
- JAMAIS de hamburger menu

---

### Composants clés

```tsx
// Nav Item inactif
className="flex items-center gap-2.5 px-3 py-2 rounded-lg
           text-[--text-secondary] text-[13px] font-[family-name:var(--font-ui)]
           hover:bg-[--bg-surface-3] hover:text-[--text-primary]
           transition-all duration-150 cursor-pointer"

// Nav Item actif
className="flex items-center gap-2.5 px-3 py-2 rounded-lg
           text-[--color-primary] text-[13px] font-[family-name:var(--font-ui)]
           bg-[--color-primary-dim] border border-[--color-primary-border]"

// Stat Card
className="bg-[--bg-surface-1] border border-[--border-subtle] rounded-xl p-4"

// Badge FUT
className="font-[family-name:var(--font-ui)] text-[9px] font-bold
           tracking-widest uppercase px-1.5 py-0.5 rounded
           bg-[--color-primary] text-[--color-primary-text]"

// Bouton primaire
className="font-[family-name:var(--font-ui)] text-[11px] font-semibold
           tracking-wider uppercase px-4 py-2 rounded-lg
           bg-[--color-primary] text-[--color-primary-text]
           hover:opacity-90 active:scale-[0.98] transition-all"
```

```tsx
// Score / Chimie hero
<span className="font-[family-name:var(--font-display)]
                 text-6xl uppercase tracking-tight
                 text-[--color-primary]">87</span>
<span className="font-[family-name:var(--font-ui)]
                 text-xl text-[--text-muted]">/100</span>
```

---

### Chimie FUT — utils/chemistry.ts

```ts
export const CHEMISTRY_COLORS = {
  optimal: 'var(--chem-optimal)',
  good:    'var(--chem-good)',
  weak:    'var(--chem-weak)',
  bad:     'var(--chem-bad)',
} as const

export const CHEMISTRY_STROKE = {
  optimal: 2.5,
  good:    2.0,
  weak:    1.8,
  bad:     2.0,
} as const

export const CHEMISTRY_OPACITY = {
  optimal: 0.85,
  good:    0.75,
  weak:    0.70,
  bad:     0.80,
} as const
```

---

## Connexion Supabase

```
VITE_SUPABASE_URL=[URL staging]
VITE_SUPABASE_ANON_KEY=[clé anon staging]
```

## Tables Supabase utilisées

user_profiles, players, coaches, team_members, organizations, teams, seasons,
matches, match_stats, player_badges, trainings, training_drills,
training_attendance, drills, fines, fine_rules, team_treasury,
treasury_expenses, subscriptions, lineups, player_relationships,
events, forum_posts, forum_replies

## Rôles (RLS déjà configuré)

player / coach / fine_manager / club_admin / super_admin

---

## Pages à développer en priorité

### 1. Onboarding (3 étapes)
- /onboarding/club → création club
- /onboarding/paiement → sélection plan Solo/Club, toggle mensuel/annuel, Stripe
- /onboarding/equipe → ajout joueurs + nom équipe

### 2. Dashboard /dashboard
- Card prochain match
- Card prochain entraînement
- Card forme équipe (5 derniers matchs W/D/L)
- Card taux présences 30 jours
- Card solde cagnotte amendes
- Liste 5 derniers matchs avec scores

### 3. Équipe /equipe
- Liste joueurs avec avatar, nom, poste, numéro
- Filtres par poste
- Fiche joueur /equipe/:id avec stats, badges, présences

### 4. Calendrier /calendrier
- Vue mensuelle : matchs (vert) + entraînements (bleu) + événements (orange)
- Clic sur un jour → détail

### 5. Match /match/:id
- Feuille de match : composition, stats joueurs, note /10
- Bouton override manuel si données API incorrectes

### 6. Entraînements /entrainements
- Liste séances passées et à venir
- /seance/:id → plan avec phases (échauffement, tactique, technique, match)
- Gestion présences par séance

---

## Règles importantes

- Vérifier statut abonnement avant features payantes
- Rediriger vers /onboarding/paiement si subscription.status !== 'active'
- Utiliser hooks Supabase Auth pour sessions
- Toutes les mutations passent par RLS Supabase — pas de bypass client
- Dark mode par défaut : data-theme="dark" sur <html>

## Ce que tu NE dois PAS faire

- Pas de backend custom — tout passe par Supabase
- Pas de clés secrètes côté client
- Pas de bypass RLS
- Pas de hamburger menu mobile
- Pas de valeurs hexadécimales d'accent hardcodées dans les composants
- Pas de Chaney en navigation, labels ou corps de texte
- Pas de transitions > 150ms sauf animations d'entrée de page

## Commence par

1. Setup design system complet (globals.css, tailwind.config, fonts)
2. Hook useTheme + application data-theme sur <html>
3. Layout principal : sidebar desktop 220px + bottom bar mobile
4. Page connexion/inscription avec Supabase Auth
5. Flow onboarding 3 étapes
6. Dashboard principal

Génère du code propre, commenté, scalable.
Chaque composant dans son propre fichier.
Custom hooks pour toute la logique Supabase.

---

> Fonts : Chaney Ultra Extended + N27 Regular/Italic — Atipo Foundry (atipofoundry.com)
> Fichiers .woff2 à placer dans /public/fonts/ avant de démarrer Lovable
