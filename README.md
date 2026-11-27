# Facturation & relances

Projet React de la majeure MTI, sujet n°38. Le front `invoicing` fourni avec le cours, refactoré : une librairie de composants documentée dans Storybook, les appels branchés sur le backend Spring Boot, l'authentification avec refresh token, une gestion des utilisateurs et des tests de bout en bout.

Le service comptable prépare des factures en brouillon puis les émet. Une facture émise reçoit un numéro `FAC-AAAA-NNNN` et ne bouge plus : on la corrige par un avoir. Les paiements partiels et les avoirs soldent la facture, les retards se relancent à J+7, J+15 et J+30. Les clients consultent leurs factures.

Démo en ligne (mode bouchonné, données en mémoire) : https://facturation.bantou.me, et son Storybook : https://facturation.bantou.me/storybook/

## Démarrer

Node 26.13.1 (fichier `.nvmrc`) et npm 11.

```bash
nvm use
npm install
```

### Avec le backend

Le backend du cours tourne sur `http://localhost:8080` (`cd backend && docker compose up -d`).

```bash
npm run seed       # crée trois comptes et cinq factures par l'API, relançable sans doublon
npm run dev        # http://localhost:5138
```

| Compte | Mot de passe | Rôle |
|---|---|---|
| admin@example.com | change-me (celui du `.env` du backend) | administrateur |
| claire@example.com | claire123 | service comptable |
| acme@example.com | acme12345 | client |
| globex@example.com | globex123 | client |

Le backend est ailleurs ? `VITE_API_URL=http://hote:port npm run dev`. Pour le script : `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

### Sans backend

```bash
npm run dev:mock   # même application, API bouchonnée en mémoire
```

Les comptes de démonstration sont rappelés sur la page de connexion. Les données reviennent à leur état initial à chaque rechargement. Ce mode sert aux tests de bout en bout et à la démo en ligne. Il contient des factures en retard, que l'API réelle ne permet pas de créer le jour même.

### Avec Docker

```bash
docker compose up --build -d    # http://localhost:5138, relaie /api vers le backend de l'hôte
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement branché sur le backend |
| `npm run dev:mock` | Serveur de développement bouchonné |
| `npm run build` | Vérification TypeScript puis build Vite dans `dist/` |
| `npm run lint` | oxlint, règles React et accessibilité |
| `npm test` | Tests unitaires et tests des stories (Chromium sans interface) |
| `npm run test:e2e` | Tests Playwright sur l'application bouchonnée |
| `npm run test:e2e:api` | Tests Playwright contre le vrai backend |
| `npm run storybook` | Catalogue des composants sur http://localhost:6006 |
| `npm run seed` | Jeu de démonstration dans le backend |

Premier lancement des tests : `npx playwright install`.

## Organisation

```
src/
├── components/     librairie générique : un dossier par composant
│   └── Button/     Button.tsx, Button.scss, Button.stories.tsx, index.ts
├── features/       composants métier, rangés par domaine
│   ├── auth/       contexte d'authentification, formulaire de connexion
│   ├── invoices/   tableau, lignes, formulaire, paiement, avoir, relances, calculs
│   ├── users/      tableau et formulaire des utilisateurs
│   └── simulation/ réglage de la latence et des pannes
├── hooks/          useQuery, useAction, useDocumentTitle
├── lib/api/        contrat typé de l'API et client HTTP
├── mocks/          API bouchonnée, derrière la même interface
├── pages/          une page par route
└── styles/         tokens Sass et reset
```

### Routes

| Route | Page | Accès |
|---|---|---|
| `/login` | Connexion | public |
| `/` | Factures, filtre par statut et recherche | connecté (un client voit les siennes) |
| `/invoices/:id` | Détail : lignes, paiements, avoirs, relances | connecté |
| `/new`, `/invoices/:id/edit` | Éditeur de brouillon | comptable |
| `/reminders` | Relances à envoyer | comptable |
| `/dashboard` | Chiffres de l'année, retards par ancienneté | comptable |
| `/clients`, `/clients/:id` | Encours par client, relevé de compte | comptable |
| `/users`, `/users/new`, `/users/:id/edit` | Gestion des utilisateurs | administrateur |
| `/simulation` | Latence et pannes simulées de l'API | administrateur |

Les trois dernières lignes n'existaient pas dans le projet de départ.

## Les composants

Règles suivies partout :

- **Autoporteur.** Le composant importe sa feuille Sass et vit avec ses stories. Le déplacer, c'est déplacer son dossier.
- **Pas de CSS dans les pages.** Les pages et `App.tsx` ne contiennent ni `className` ni `style`. La mise en page passe par `Stack`, `Row`, `Grid` et `Narrow`.
- **Un contrat fermé.** Aucun composant n'accepte `className` ou `style`. Les variantes sont des props typées (`variant`, `tone`, `size`, `gap`), documentées dans Storybook.
- **Tokens.** Couleurs, espacements et rayons viennent de `src/styles/_tokens.scss`, repris de la feuille d'origine.
- **Données en props, événements en callbacks.** Aucun composant n'appelle l'API : les pages chargent les données avec `useQuery` et lancent les actions avec `useAction`. C'est ce qui permet de montrer chaque état dans une story, erreurs comprises.
- **Spécialiser en enveloppant.** `ButtonLink` reprend l'apparence de `Button` pour un lien. `DataTable` décrit un `Table` par ses colonnes. `InvoiceStatusBadge` est un `Badge` dont le ton dépend du statut, `InvoiceTable` un `DataTable` avec ses colonnes.

Génériques : AppLayout, AuthLayout, Alert, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field (TextField, SelectField, CheckboxField), Layout, Loader, PageHeader, Pagination, ProgressBar, StatTile, Table, Text, Toast.

## Appels au backend

`src/lib/api/types.ts` décrit les DTO du Swagger et l'interface `Api`. Deux implémentations : `http.ts` (le backend) et `mocks/api.ts` (le bouchon). `VITE_API_MODE` choisit à la compilation, et le bouchon ne part pas dans le build de production.

Les appels passent par `/api` sur la même origine que le front : relais Vite en développement, nginx dans l'image Docker. Le relais retire l'en-tête `Origin`, sans quoi le CORS du backend, limité aux ports 5101 à 5111, répond 403.

Toute erreur arrive au format `ErrorResponse` du backend, pannes réseau et délais dépassés compris. Les erreurs de validation (`fields`) s'affichent sous le champ concerné, les refus métier (409) en tête du formulaire, les erreurs de chargement avec un bouton Réessayer qui respecte `Retry-After`.

### Authentification

- Le jeton d'accès reste en mémoire.
- Sur un 401, le client demande de nouveaux jetons à `/api/auth/refresh` et rejoue la requête une fois. Plusieurs 401 simultanés ne déclenchent qu'un refresh.
- Le jeton de rafraîchissement est gardé dans `sessionStorage` : la session survit à un rechargement et s'arrête à la fermeture de l'onglet. Un cookie HttpOnly serait préférable, il faudrait modifier le backend.
- Refresh refusé : retour à la connexion avec un message, puis retour à la page demandée une fois reconnecté.

## Tests

| Niveau | Outil | Contenu |
|---|---|---|
| Unitaire | Vitest | calculs de facturation (`invoice.test.ts`) |
| Composant | Storybook + Vitest | chaque story rendue dans Chromium, interactions des fonctions `play`, contrôle d'accessibilité axe bloquant |
| Bout en bout | Playwright | 19 scénarios sur l'application bouchonnée, Chromium, Firefox et WebKit |
| Bout en bout réel | Playwright | 7 scénarios contre le backend : refresh du jeton, cycle d'une facture, CRUD utilisateurs, pannes simulées |

La CI GitHub Actions lance lint, build, tests de composants, build du Storybook et E2E sur chaque PR.

Pour les tests contre le backend : le lancer, `npm run seed`, puis `npm run test:e2e:api`. Avec `JWT_ACCESS_TTL=PT5S` dans le `.env` du backend, chaque étape du test force un refresh du jeton.

## Démarche

Le plan écrit avant de commencer est dans l'historique (PR #1). L'ordre suivi, une PR relue par étape :

1. tests E2E sur l'application d'origine, avant tout changement, et CI
2. librairie de composants et Storybook, sans toucher aux pages
3. client HTTP, refresh du jeton, hooks de chargement
4. migration des pages sur les composants et sur l'API, suppression de `main.scss`
5. gestion des utilisateurs
6. encours par client et simulation de pannes
7. Docker, jeu de démonstration, tests contre le backend

Les tests E2E de l'étape 1 ont suivi tout le refactoring. Ils n'ont changé qu'aux endroits où le comportement change (confirmation avant émission, jeu de données élargi).

## Ce que demandait le sujet

- [x] brancher les appels au backend
- [x] authentification, expiration du token, refresh token
- [x] librairie de composants UI
- [x] Storybook avec les composants et leurs cas
- [x] tests E2E Playwright
- [x] page de gestion des utilisateurs (CRUD)
- [x] bonnes pratiques UX/UI
- [x] visuel des composants conservé

### Écarts assumés avec le visuel d'origine

- Le vert `$success` passe de `#15803d` à `#147a3a` : sur son fond clair, l'original atteignait 4,48:1 de contraste, sous le seuil AA de 4,5:1.
- Anneau de focus visible au clavier.
- Libellés visibles sur les champs de paiement et d'avoir, qui n'avaient qu'un `aria-label`.
- La navigation dépend du rôle : un client ne voit plus les entrées réservées au service comptable.

### Ajouts UX

Confirmation avant les actions irréversibles (émission, suppression), messages de succès, filtre de statut dans l'URL, recherche, duplication d'une facture, barre de règlement, frise des trois niveaux de relance, impression du détail et du relevé, lien d'évitement, titre d'onglet et focus sur le titre à chaque changement de page.

## Limites connues

- Pas de cache partagé entre les pages : chaque écran recharge ses données. Au-delà de quelques écrans sur les mêmes données, TanStack Query remplacerait `useQuery`.
- L'encours par client se calcule dans le navigateur à partir de la liste des factures. Avec beaucoup de factures, il faudrait un endpoint dédié.
- En mode bouchonné, un rechargement de page déconnecte, comme dans le projet de départ.
