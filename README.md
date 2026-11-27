# 38 — Facturation & relances

Le service comptable (rôle ACCOUNTANT) prépare des factures en brouillon puis les émet : elles reçoivent un numéro continu FAC-AAAA-NNNN et ne sont plus jamais modifiées. Les paiements partiels et les avoirs (AVO-AAAA-NNNN) soldent la facture ; les retards sont relancés à J+7, J+15 et J+30. Les clients consultent leurs factures émises.

Application React (TypeScript strict, Vite, React Router, Sass). Les appels à l'API sont **bouchonnés** dans `src/mocks/api.ts` : l'application fonctionne seule, sans backend. Les données de démonstration (`src/mocks/data.ts`) sont en mémoire et réinitialisées à chaque rechargement.

Spécification de l'API : [`project/CLAUDE.md`](../../../CLAUDE.md), §5.38.

## Démarrer

Version de Node : **26.13.1** (fichier `.nvmrc`), avec npm 11.20 ; Vite 8.3, React 19.3 et React Router 8.5.

```bash
nvm use            # lit .nvmrc (nvm install si la version manque)
npm install
npm run dev        # http://localhost:5138
```

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement sur le port 5138 |
| `npm run build` | Vérification TypeScript (strict) puis build Vite dans `dist/` |
| `npm run preview` | Sert le build de `dist/` sur le port 5138 |
| `npm run lint:styles` | Vérifie que la feuille Sass `src/styles/main.scss` compile |

Avec Docker, depuis ce dossier : `docker compose up --build -d` (même port), `docker compose down` pour arrêter.

## Comptes de démonstration

Rappelés sur la page de connexion (bouton « Utiliser »).

| E-mail | Mot de passe | Rôle |
|---|---|---|
| admin@example.com | admin123 | ADMIN — comptable d'office |
| claire@example.com | claire123 | USER — rôle ACCOUNTANT |
| acme@example.com | acme123 | USER — client, une facture en retard |
| globex@example.com | globex123 | USER — client |

## Routes

Toutes les routes, sauf `/login`, exigent d'être connecté. Les routes **ADMIN** redirigent un utilisateur simple vers l'accueil.

| Route | Page | Accès | Description |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Connexion |
| `/` | `InvoicesPage` | Connecté | Toutes les factures (comptable) ou mes factures (client), filtres par statut |
| `/new` | `EditorPage` | Connecté | Nouvelle facture |
| `/invoices/:id/edit` | `EditorPage` | Connecté | Modifier un brouillon |
| `/invoices/:id` | `InvoicePage` | Connecté | Détail : lignes, paiements, avoirs, relances |
| `/reminders` | `RemindersPage` | Connecté | Relances à envoyer |
| `/dashboard` | `DashboardPage` | Connecté | Facturé, encaissé, restant dû, retards |

## Endpoints bouchonnés

Mêmes routes, DTO, règles métier et format d'erreur que l'API Spring Boot.

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/invoices/me/roles`
- `POST /api/invoices` — ACCOUNTANT
- `PUT /api/invoices/{id}` — ACCOUNTANT, brouillon uniquement
- `POST /api/invoices/{id}/issue` — numéro FAC continu, sans trou
- `GET /api/invoices?status=&clientId=&overdue=`
- `GET /api/invoices/{id}`
- `POST /api/invoices/{id}/payments` — paiements + avoirs ≤ TTC
- `POST /api/invoices/{id}/credit-notes` — avoir ≤ reste dû
- `GET /api/invoices/reminders/due` — ACCOUNTANT
- `POST /api/invoices/{id}/reminders` — une relance par niveau
- `GET /api/invoices/stats?year=` — ACCOUNTANT
- `GET /api/invoices/clients`

## Organisation

```
src/
├── main.tsx          # point d'entrée
├── App.tsx           # contexte d'authentification, en-tête, routes
├── pages/            # une page par route
├── mocks/api.ts      # API bouchonnée (mockApi)
├── mocks/data.ts     # données de démonstration
└── styles/main.scss  # feuille de style unique
```
