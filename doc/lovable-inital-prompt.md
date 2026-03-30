Tu vas développer "Tactik Coach" (app.tactik.coach), un ERP SaaS pour entraîneurs de football amateur belge. C'est une application React + TypeScript connectée à Supabase.

## Stack technique
- Frontend : React + TypeScript
- Backend : Supabase (déjà configuré)
- Auth : Supabase Auth (email + OAuth Google)
- Paiements : Stripe (déjà configuré)
- Emails : Resend (déjà configuré)
- UI : Tailwind CSS + shadcn/ui

## Design system
- Typographie : Inter
- Couleur principale : #16a34a (vert Tactik — provisoire)
- Mode : Dark/Light avec toggle persistant (localStorage)
- Responsive : sidebar fixe à gauche sur desktop, navigation bottom bar sur mobile
- Style général : sobre, professionnel, moderne — inspiré de Linear et Notion

## Thème Dark
- Background principal : #0f0f0f
- Background secondaire : #1a1a1a
- Background cards : #242424
- Texte principal : #f5f5f5
- Texte secondaire : #a0a0a0
- Bordures : #2e2e2e
- Accent : #16a34a

## Thème Light
- Background principal : #ffffff
- Background secondaire : #f8f9fa
- Background cards : #ffffff
- Texte principal : #0f0f0f
- Texte secondaire : #6b7280
- Bordures : #e5e7eb
- Accent : #16a34a

## Navigation Desktop (sidebar gauche fixe)
- Logo Tactik en haut
- Toggle Dark/Light
- Menu items :
  - Dashboard (icône home)
  - Équipe (icône users)
  - Calendrier (icône calendar)
  - Entraînements (icône activity)
  - Stats (icône bar-chart)
  - Exercices (icône book-open)
  - Amendes (icône dollar-sign)
  - Événements (icône star)
  - Présences (icône check-square)
- Séparateur
- Admin (icône settings) — visible club_admin uniquement
- Profil utilisateur en bas

## Navigation Mobile (bottom bar)
- 5 items max : Dashboard, Équipe, Calendrier, Entraînements, Plus (...)
- "Plus" ouvre un drawer avec les autres sections

## Pages à développer en priorité (dans cet ordre)

### 1. Onboarding (3 étapes)
- /onboarding/club → formulaire création club (nom, ville, sport)
- /onboarding/paiement → sélection plan Solo/Club avec toggle mensuel/annuel, carte bancaire Stripe
- /onboarding/equipe → ajout joueurs + nom équipe

### 2. Dashboard /dashboard
- Card "Prochain match" (date, adversaire, domicile/extérieur)
- Card "Prochain entraînement" (date, lieu)
- Card "Forme de l'équipe" (résultats 5 derniers matchs — W/D/L)
- Card "Présences" (taux moyen 30 derniers jours)
- Card "Cagnotte amendes" (solde actuel)
- Liste des 5 derniers matchs avec scores

### 3. Équipe /equipe
- Liste des joueurs avec avatar, nom, poste, numéro
- Filtres par poste
- Fiche joueur /equipe/:id avec stats saison, badges, présences

### 4. Calendrier /calendrier
- Vue mensuelle avec matchs + entraînements + événements
- Couleurs distinctes : vert = match, bleu = entraînement, orange = événement
- Clic sur un jour → détail

### 5. Matchs /match/:id
- Feuille de match : composition, stats par joueur (buts, assists, cartons, temps de jeu, note /10)
- Bouton "Override manuel" si données API incorrectes

### 6. Entraînements /entrainements
- Liste des séances passées et à venir
- /seance/:id → plan de séance avec phases (échauffement, tactique, technique, match)
- Gestion des présences par séance

## Connexion Supabase
Variables d'environnement :
- VITE_SUPABASE_URL=[URL staging]
- VITE_SUPABASE_ANON_KEY=[clé anon staging]

## Tables Supabase principales utilisées
- user_profiles, players, coaches, team_members
- organizations, teams, seasons
- matches, match_stats, player_badges
- trainings, training_drills, training_attendance, drills
- fines, fine_rules, team_treasury, treasury_expenses
- subscriptions, lineups, player_relationships
- events, forum_posts, forum_replies

## Rôles utilisateurs (RLS déjà configuré)
- player : accès lecture profil + stats
- coach : accès ERP complet de son équipe
- fine_manager : accès section amendes uniquement
- club_admin : accès ERP + gestion licences
- super_admin : accès total

## Règles importantes
- Toujours vérifier le statut de l'abonnement avant d'afficher les features payantes
- Rediriger vers /onboarding/paiement si subscription.status !== 'active'
- Utiliser les hooks Supabase Auth pour la gestion des sessions
- Toutes les mutations passent par les RLS Supabase — pas de bypass côté client
- Le toggle Dark/Light persiste dans localStorage sous la clé 'tactik-theme'

## Ce que tu NE dois PAS faire
- Ne pas créer de backend custom — tout passe par Supabase
- Ne pas stocker de clés secrètes côté client
- Ne pas bypasser les RLS Supabase
- Ne pas utiliser de bibliothèques non listées sans me demander

## Commence par
1. Mettre en place le design system complet (thèmes dark/light, typography, composants de base)
2. Créer le layout principal avec sidebar desktop + bottom bar mobile
3. Créer la page de connexion et d'inscription avec Supabase Auth
4. Créer le flow d'onboarding en 3 étapes
5. Créer le dashboard principal

Génère du code propre, commenté, et scalable. Chaque composant dans son propre fichier. Utilise des custom hooks pour la logique Supabase.
