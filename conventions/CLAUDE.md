# CLAUDE.md : instructions pour l'assistant de codage

Ce fichier guide l'assistant IA qui aide à écrire le code de ce dépôt. Il est versionné, comme l'exige l'énoncé du projet.

**Règle principale : l'IA exécute, l'équipe décide.** Les choix d'architecture sont pris par l'équipe et consignés dans le DAT et ses ADR. L'assistant les applique ; il ne les change pas de lui-même.

**Conventions de nommage, de commit et de revue** : elles sont dans `CONTRIBUTING.md`, importé ci-dessous. Elles s'appliquent à tout ce que l'assistant écrit, propose ou corrige.

@CONTRIBUTING.md

## 1. Le projet en bref

Application de gestion d'un festival de jeux de société pour une association :
- suivi des exposants (CRM), festival par festival ;
- réservations de tables par zone tarifaire, avec prix et remises ;
- placement des jeux sur le plan ;
- facturation PDF et suivi des paiements.

Documents de référence, dans `docs/` :
- `besoin.tex` / `besoin.pdf` : le **besoin du client**. Il fait référence en cas de doute fonctionnel.
- `DAT.tex` / `DAT.pdf` : l'**architecture** (sections 4 à 8, modèle de données, liste des endpoints en annexe G).
- `ADR-registre.pdf` et `docs/adr/` : les **décisions d'architecture**.

Avant d'écrire du code, lire la partie du DAT et les ADR qui concernent la tâche. En cas de contradiction entre une demande et le DAT, **le signaler** au lieu de choisir seul.

## 2. Contraintes imposées (non négociables)

- **Front-end** : Angular ≥ 22, syntaxe moderne uniquement :
  - composants `standalone`, sans `NgModule` ;
  - signaux (`signal`, `computed`) et `inject()`, pas d'injection par le constructeur ;
  - contrôle de flux `@if` / `@for` / `@switch`, jamais `*ngIf` ni `*ngFor`.
- **Back-end** : Node.js et **TypeScript** (mode strict), Express. Pas de framework applicatif (ni NestJS, ni AdonisJS).
- **Base de données** : PostgreSQL avec le pilote `pg`. **Pas d'ORM ni de query builder** (ni Prisma, ni TypeORM, ni Sequelize, ni Knex) : SQL écrit à la main.
- **Environnement** : tout doit se lancer avec `docker compose up`, sans rien installer d'autre que Docker.

## 3. Architecture du back-end (ADR-005)

Quatre couches. Chaque couche n'appelle que celle du dessous :

| Couche | Dossier | Rôle | Interdit |
|---|---|---|---|
| Routes | `api/src/routes` | URL, méthode, intergiciels de droits (`exigerNiveau(n)`, `exigerRole('tresorier')`) | logique métier, SQL |
| Contrôleurs | `api/src/controleurs` | lire la requête, la valider avec `zod`, appeler le service, choisir le code HTTP | SQL, règles métier |
| Services | `api/src/services` | règles métier (prix, remises, capacité, workflow, masquage) | `req`, `res`, tout ce qui touche à HTTP, SQL |
| Dépôts | `api/src/depots` | **seul** endroit qui contient du SQL | règles métier |

Règles SQL :
- **Toujours** des requêtes paramétrées (`$1`, `$2`…). **Jamais** de concaténation ni de gabarit de chaîne avec une valeur reçue.
- Une fonction par requête, avec un nom explicite (`trouverReservationParId`).
- Toute opération qui écrit dans plusieurs tables passe par `avecTransaction(async (client) => …)`, et chaque dépôt reçoit le `client` en paramètre.
- Création ou modification d'une réservation : verrouiller les zones avec `SELECT … FOR UPDATE`, dans l'ordre croissant des identifiants (ADR-008), puis recalculer les tables restantes.
- Le statut d'une réservation se lit **toujours** dans la vue `v_reservation_statut` (ADR-009).

## 4. Base de données

- Le schéma évolue **uniquement** par des migrations numérotées dans `db/migrations/` (`002_ajout_xxx.sql`…). Ne jamais modifier une migration déjà fusionnée dans `main`.
- Migrations **additives** : on ajoute d'abord ; une suppression de colonne se fait dans une version ultérieure (ADR-010).
- Montants en `NUMERIC(10,2)`, jamais en flottant. Horodatages en `TIMESTAMPTZ`. États en `VARCHAR` avec `CHECK`.
- Factures : jamais d'`UPDATE` sur le contenu, jamais de `DELETE`. Une correction se fait par annulation, puis nouvelle facture (ADR-003, ADR-007).
- Comptes : `utilisateur.niveau` (de 1 à 5) et `est_tresorier` (ADR-013). Il n'y a pas de table des rôles.

## 5. Sécurité (section 6 du DAT)

- Les droits sont **toujours** vérifiés dans l'API. Une garde Angular sert seulement à l'ergonomie.
- Les données commerciales sont masquées par **liste blanche** (ADR-002) : construire la réponse publique en recopiant seulement les champs autorisés, jamais en supprimant des champs d'un objet complet.
- Mots de passe hachés avec `bcrypt` (coût 12). Jeton JWT dans un cookie `HttpOnly; Secure; SameSite=Strict`, jamais dans `localStorage` (ADR-006).
- Angular : ne jamais utiliser `innerHTML` avec des données non nettoyées.
- **Aucun secret dans le code ni dans Git** : variables d'environnement seulement. Seul `.env.example` est versionné, avec des valeurs d'exemple.
- Les messages d'erreur 500 ne doivent pas exposer de détail interne (pile d'appels, requête SQL).

## 6. Conventions de l'API (section 4.3 et annexe G du DAT)

- Préfixe `/api/v1` ; ressources au pluriel, en français et en kebab-case (`/zones-tarifaires`).
- Actions métier en `PATCH` sur une sous-ressource (`/reservations/:id/validation`).
- JSON en camelCase ; dates en ISO 8601 ; montants en chaîne décimale (`"125.50"`).
- Format des erreurs : `{ "code": "CAPACITE_DEPASSEE", "message": "…", "details": {…} }`.
- Codes : 400 (données invalides), 401 (non connecté), 403 (droits insuffisants), 404 (introuvable), 409 (conflit, par exemple une suppression refusée parce que des données y font référence).
- Toute nouvelle route doit figurer dans la liste des endpoints du DAT : **le signaler** à l'équipe si elle n'y est pas.

## 7. Front-end

- Un dossier par fonctionnalité dans `frontend/src/app/features/` ; `core/` pour l'authentification, les intercepteurs et les gardes ; `shared/` pour les composants réutilisables.
- Routes chargées à la demande (`loadChildren`), gardes `canMatch`.
- État : chaque service expose des signaux en lecture seule, et des `computed` pour les valeurs dérivées. Pas de NgRx.
- Appels à l'API par `HttpClient` avec `withCredentials`, un service par ressource.

## 8. Tests et qualité

- Tout code de service ou de route s'accompagne de tests.
- Tests à ne jamais supprimer ni affaiblir :
  - matrice des droits rôle × route ;
  - non-fuite des informations commerciales ;
  - capacité en accès concurrents ;
  - immuabilité des factures.
- Le code doit passer `npm run lint` et `tsc --noEmit` sans erreur.
- Commande des tests : `docker compose run --rm api npm test`.

## 9. Git et messages de commit

- Respecter les sections 2 à 4 de `CONTRIBUTING.md` (branches, commits, merge requests).
- Pour un commit, utiliser `/commit` (`../../../Téléchargements/conventions/.claude/commands/commit.md`) : proposer le message, puis **attendre la confirmation** avant de lancer `git commit`.
- Si un message de commit ou un nom écrit par l'équipe ne respecte pas les conventions, **proposer la correction**.
- Ne jamais créer ni pousser de tag `dat-v*` : c'est une décision de l'équipe.

## 10. Ce que l'assistant doit faire d'abord, ou ne pas faire

**Demander avant d'agir**, ou signaler, si la tâche :
- contredit le DAT ou un ADR accepté ;
- demande un nouveau choix d'architecture : nouvelle dépendance importante, nouvelle table, changement du format d'authentification ou de l'organisation en couches. Proposer alors les options ; l'équipe tranche et rédige l'ADR ;
- dépend d'une règle encore marquée « à confirmer » dans le besoin. Ne pas inventer la règle du client.

**Ne jamais** :
- ajouter un ORM, un query builder ou un framework back-end ;
- écrire du SQL hors de `api/src/depots`, ou du SQL non paramétré ;
- désactiver une vérification de sécurité ou un test pour « faire passer » le pipeline ;
- commiter un secret, un fichier `.env` ou une clé.

**Après une modification d'architecture acceptée par l'équipe**, rappeler qu'il faut mettre à jour le DAT, le journal des évolutions et, si besoin, le registre des ADR.

## 11. Langue

Code (identifiants) en français, comme dans le DAT (`reservation`, `exigerNiveau`, `avecTransaction`). Commentaires, documentation et messages d'erreur destinés aux utilisateurs en français.
