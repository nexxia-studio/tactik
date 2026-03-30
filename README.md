# Tactik

Plateforme SaaS dédiée au football amateur belge.

**Deux produits :**
- [Tactik Stats](https://stats.tactik.coach) — plateforme publique de statistiques
- [Tactik Coach](https://app.tactik.coach) — ERP entraîneur (abonnement)

---

## Stack technique

| Couche | Outil |
|--------|-------|
| Frontend | React + TypeScript (Lovable) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Edge Functions | Deno / TypeScript |
| Paiements | Stripe |
| Emails | Resend |
| Data sport | VoetbalInBelgië API |
| Repo | GitHub |

---

## Environnements

| | Staging | Production |
|--|---------|------------|
| Supabase | `tactik-staging` | `tactik-production` |
| Région | West EU Paris | West EU Paris |
| Stripe | Test mode | Live mode |
| URL | `staging.tactik.coach` | `tactik.coach` |

---

## Structure du repo
```
tactik/
├── supabase/
│   ├── migrations/          # Migrations SQL versionnées
│   │   ├── 20260328000001_core_enums.sql
│   │   ├── 20260328000002_core_tables.sql
│   │   ├── 20260328000003_users_profiles.sql
│   │   ├── 20260328000004_matches_stats.sql
│   │   ├── 20260328000005_coach_erp.sql
│   │   └── 20260328000006_subscriptions_rls.sql
│   ├── functions/           # Edge Functions Supabase
│   │   ├── import-matches/  # Import API VoetbalInBelgië
│   │   ├── compute-badges/  # Calcul badges joueurs
│   │   ├── stripe-webhook/  # Gestion paiements Stripe
│   │   └── send-email/      # Emails transactionnels Resend
│   └── seed/
│       └── 01_seed_staging.sql  # Données de test (RFC Xhoffraix)
└── docs/
    └── architecture-frontend.md
```

---

## Base de données — tables principales

### Core
- `sports` — sports supportés (football, rugby, basket...)
- `seasons` — saisons sportives
- `organizations` — clubs
- `teams` — équipes par saison
- `players` — profils joueurs (publics)
- `coaches` — profils coaches (publics)
- `user_profiles` — comptes utilisateurs
- `team_members` — liens users ↔ équipes

### Stats & matchs
- `matches` — matchs (championnat, amical, coupe)
- `match_stats` — stats individuelles par match
- `player_badges` — badges gamification
- `player_relationships` — liens familiaux / ex-coéquipiers

### ERP Coach
- `trainings` — séances d'entraînement
- `training_drills` — exercices dans une séance
- `training_attendance` — présences
- `drills` — bibliothèque d'exercices
- `events` — activités extra-sportives
- `fines` — amendes individuelles
- `fine_rules` — barème des amendes
- `team_treasury` — cagnotte équipe
- `treasury_expenses` — dépenses cagnotte
- `lineups` — compositions tactiques + chimie FUT

### Monétisation
- `subscriptions` — abonnements Stripe

### Forum
- `forum_posts` — discussions
- `forum_replies` — réponses

### API & Cache
- `api_cache` — cache des réponses API sport
- `api_competitions` — compétitions à importer

---

## Edge Functions

### `import-matches`
Import automatique des résultats et classements depuis l'API VoetbalInBelgië.
- Déclenchement : cron toutes les 15 minutes
- TTL adaptatif : 4h (semaine) / 1h (weekend matin) / 15min (weekend après 15h)
- Déclenche `compute-badges` après chaque import réussi

### `compute-badges`
Calcul automatique des badges joueurs par équipe et par saison.
- 7 badges MVP : top scorer, top assist, iron man, yellow card king, red card king, attendance king, fine leader
- Support ex-aequo — plusieurs joueurs peuvent partager le même badge

### `stripe-webhook`
Gestion des événements Stripe pour la monétisation.
- 6 événements : checkout.completed, subscription.created/updated/deleted, invoice.paid/failed
- Envoie les emails transactionnels via `send-email`

### `send-email`
Envoi centralisé des emails transactionnels via Resend.
- 5 templates : bienvenue, invitation fine manager, confirmation abonnement, paiement échoué, rappel renouvellement
- Multilingue : FR / NL / EN

---

## Pricing

| Plan | Mensuel | Annuel |
|------|---------|--------|
| Solo | 9€ | 89€ |
| Solo+ | 14€ | 129€ |
| Club 2 | 16€ | 149€ |
| Club 3 | 23€ | 199€ |
| Club 5 | 35€ | 299€ |
| Club 8 | 49€ | 399€ |
| Club 10 | 59€ | 479€ |

Offre lancement : -20% les 3 premiers mois (50 redemptions max)
Essai gratuit : 14 jours avec carte bancaire

---

## Variables d'environnement
```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
VOETBALINBELGIE_API_KEY=
VITE_ENV=staging|production
```

---

## Lancement

**Marché initial :** Football amateur — Province de Liège (P1, P2C, P3D)

**Roadmap :**
1. MVP — Province de Liège ← *en cours*
2. V2 — Wallonie complète
3. V3 — Belgique + France + Pays-Bas
4. V4 — Multi-sport (rugby, basket, volley)

---

## Contact

Antoine Monie — Fondateur Nexxia / Tactik
[tactik.coach](https://tactik.coach)
