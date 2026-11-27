# Facturation & relances

Projet React de la majeure MTI, sujet n°38. Je pars du front `invoicing` fourni avec le cours : six pages, des appels bouchonnés, une seule feuille Sass. Ce fichier est mon plan avant de toucher au code. Je le remplacerai par la vraie documentation à la fin.

## Le projet de départ

Le service comptable prépare des factures en brouillon puis les émet. Une facture émise reçoit un numéro `FAC-AAAA-NNNN` et ne bouge plus : on la corrige par un avoir. Les paiements partiels et les avoirs soldent la facture, les retards se relancent à J+7, J+15 et J+30. Les clients consultent leurs factures.

Lancer le projet tel quel :

```bash
nvm use
npm install
npm run dev        # http://localhost:5138
```

Comptes : `claire@example.com / claire123` (comptable), `acme@example.com / acme123` (client), `admin@example.com / admin123`.

## Ce que demande le sujet

- [ ] brancher les appels au backend (aujourd'hui tout passe par `src/mocks/api.ts`)
- [ ] gérer l'authentification, l'expiration du token et le refresh token
- [ ] faire une librairie de composants UI
- [ ] un Storybook avec les composants et leurs différents cas
- [ ] au moins un test E2E avec Playwright
- [ ] une page de gestion des utilisateurs (CRUD)
- [ ] appliquer les bonnes pratiques UX/UI
- [ ] ne pas changer le visuel des composants actuels

Contraintes : on ne touche pas au backend, on garde la stack (React, React Router, Vite, Sass), on peut ajouter des librairies.

Critères de notation que je garde sous les yeux : la démarche de refactoring, la qualité des composants et de leur contrat, la réutilisation, aucune responsabilité CSS dans les pages, des composants autoporteurs (le composant, son CSS, ses stories).

## Ce que j'ai relevé en lisant le code

- Aucun composant : chaque page écrit son HTML avec des classes globales (`btn btn--primary`, `card stack stack--small`, `badge badge--danger`).
- `src/styles/main.scss` fait 776 lignes et mélange reset, mise en page, éléments communs et styles de pages.
- Les pages appellent `mockApi` en direct. Chaque page refait son `useEffect` avec ses états `loading` et `error`, et aucune ne protège contre une réponse arrivée en retard.
- `useAccountant()` redemande les rôles à chaque page.
- Dans l'éditeur, les lignes de facture ont `key={i}`. Si je retire la première ligne, React recycle les champs de la suivante.
- L'utilisateur connecté vit dans un état React : un rechargement déconnecte. Ça ira pour le bouchon, plus avec un vrai token.
- Les champs des formulaires de paiement et d'avoir n'ont qu'un `aria-label`, sans libellé visible. Les erreurs s'affichent dans une `div` que les lecteurs d'écran n'annoncent pas.
- Émettre une facture est irréversible et part au premier clic.
- La navigation montre « Relances » et « Tableau de bord » aux clients, qui tombent sur « Réservé au service comptable ».

## Ordre de travail

Une branche et une PR par étape. Je relis chaque PR avant de la fusionner et la CI doit être verte.

1. **Tests E2E sur l'existant.** Avant de refactorer, je décris avec Playwright ce que l'application fait aujourd'hui : connexion, cycle de vie d'une facture, relances. Ces tests me diront si je casse quelque chose pendant la suite. J'ajoute la CI dans la même PR.
2. **Outillage et composants de base.** Storybook, lint, puis les composants sortis de `main.scss` : Button, Badge, Card, Field, Alert, Table, les composants de mise en page. Un dossier par composant avec son `.tsx`, son `.scss` et ses stories. Je recopie les règles Sass telles quelles pour garder le rendu. Les pages ne changent pas encore.
3. **Client HTTP.** Les types de l'API d'après le Swagger, un client `fetch`, le token d'accès, le refresh sur 401, les erreurs au format du backend. Pas encore branché.
4. **Migration des pages.** Les pages passent sur les composants et sur le client HTTP en même temps, puis je supprime `main.scss`. Je garde le bouchon derrière la même interface que le client HTTP pour que les tests E2E tournent sans backend.
5. **Gestion des utilisateurs.** Liste paginée, création, modification, suppression, sur `/api/users`.
6. **UX.** Confirmation avant les actions irréversibles, messages de succès, erreurs avec bouton pour réessayer, navigation selon le rôle. S'il reste du temps : une page d'encours par client et une page pour piloter la simulation de pannes du backend, qui sert à tester les états de chargement et d'erreur.
7. **Docker et documentation.**

## Règles que je me fixe

- Une page assemble des composants. Elle ne contient ni `className` ni `style`.
- Les couleurs et les espacements viennent des variables Sass existantes, regroupées dans un fichier de tokens.
- Un composant reçoit ses données par ses props et remonte les événements par des callbacks. Il n'appelle pas l'API. Les pages et les hooks s'en chargent.
- Je teste ce que voit l'utilisateur : sélecteurs par rôle et par libellé, pas par classe CSS.
- Si une bonne pratique d'accessibilité demande de modifier le rendu d'origine, je le note dans la PR.

## Points à vérifier en route

- Le CORS du backend autorise les ports 5101 à 5111 et mon front tourne sur 5138. Je compte passer par le proxy de Vite pour rester en même origine, à tester.
- Où garder le refresh token pour survivre à un rechargement sans l'exposer plus que nécessaire.
- Le backend refuse d'émettre une facture déjà échue : impossible de créer des retards par l'API pour une démo. Le bouchon restera utile pour ça.
