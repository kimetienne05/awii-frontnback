# Conventions du projet

Ce fichier fixe les règles de nommage, de commit et de revue. Il s'applique à toute l'équipe **et à l'assistant IA** : `CLAUDE.md` l'importe, donc l'assistant le lit à chaque session.

## 1. Nommage dans le code

| Élément | Règle | Exemple |
|---|---|---|
| Fichiers et dossiers | kebab-case | `reservation.service.ts`, `carte-festival/` |
| Classes, interfaces, types | PascalCase | `ReservationService`, `ReservationPublique` |
| Variables, fonctions, méthodes | camelCase, verbe pour une fonction | `calculerPrix()`, `tablesRestantes` |
| Constantes globales | MAJUSCULES_AVEC_SOULIGNÉS | `DUREE_JETON_HEURES` |
| Signaux Angular | nom du contenu, sans suffixe | `festivalCourant`, `reservations` |
| Booléens | préfixe `est`, `a` ou `peut` | `estValidee`, `peutModifier` |
| Langue des identifiants | français, sans accents | `exposant`, `zoneTarifaire` |

### Back-end (couches, ADR-005)

Un fichier par ressource et par couche, nommé `<ressource>.<couche>.ts` :

```
api/src/routes/reservation.routes.ts
api/src/controleurs/reservation.controleur.ts
api/src/services/reservation.service.ts
api/src/depots/reservation.depot.ts
api/src/types/reservation.types.ts
```

- Fonctions de dépôt : un verbe et ce qu'elles renvoient (`trouverParId`, `listerParFestival`, `creer`, `verrouillerZones`).
- Erreurs métier : classes `Erreur<Nature>` (`ErreurConflit`, `ErreurDroits`, `ErreurIntrouvable`).

### Base de données

- Tables et colonnes en `snake_case`, au singulier : `reservation`, `zone_tarifaire`.
- Clé primaire `id` ; clé étrangère `<table>_id` (`festival_id`) ; booléens `est_…` (`est_tresorier`).
- Horodatages `…_le` (`validee_le`, `cree_le`) ; dates calendaires `date_…` (`date_paiement`).
- Migrations : `db/migrations/NNN_description.sql` (`003_ajout_index_suivi.sql`).

### API

- Préfixe `/api/v1` ; ressources au pluriel, en français et en kebab-case (`/zones-tarifaires`).
- Actions métier en `PATCH` sur une sous-ressource (`/reservations/:id/validation`).
- JSON en camelCase ; codes d'erreur en MAJUSCULES (`CAPACITE_DEPASSEE`).

### Front-end

- Un dossier par fonctionnalité dans `frontend/src/app/features/` ; `core/` et `shared/` comme décrit dans le DAT.
- Composants standalone, signaux, `inject()`, `@if` / `@for` uniquement.

## 2. Branches

Format : `type/numero-issue-description-courte`, en kebab-case.

```
feat/12-calcul-prix-reservation
fix/27-capacite-zone-depassee
docs/5-dat-endpoints
```

On ne travaille jamais directement sur `main`.

## 3. Messages de commit

Format (inspiré de *Conventional Commits*) :

```
type(portée): description à l'impératif, en minuscules, sans point final

Corps facultatif : pourquoi ce changement, ce qu'il implique.

Refs #12
```

- **Première ligne** : 72 caractères au plus, à l'impératif (« ajoute », « corrige »).
- **Types** :

| Type | Usage |
|---|---|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction de bogue |
| `docs` | documentation (DAT, ADR, besoin, README) |
| `test` | ajout ou correction de tests |
| `refactor` | réorganisation du code sans changement de comportement |
| `style` | mise en forme, sans effet sur le code |
| `perf` | amélioration des performances |
| `build` | dépendances, Dockerfile, `docker-compose` |
| `ci` | pipeline GitLab |
| `chore` | tâches diverses |

- **Portées** : `front`, `api`, `db`, `ci`, `docker`, `docs`, ou une fonctionnalité (`reservations`, `factures`, `festivals`, `structures`, `jeux`, `suivi`, `auth`, `comptes`).
- **Dernière ligne** : le numéro d'issue, avec `Refs #12`, ou `Closes #12` si le commit termine l'issue.
- Changement qui casse la compatibilité (route, schéma) : `!` après le type, par exemple `feat(api)!: …`, et le détail dans le corps.

Exemples :

```
feat(reservations): calcule le prix avec la remise de précommande
fix(api): renvoie 409 quand la capacité de la zone est dépassée
docs(dat): ajoute les codes HTTP à la liste des endpoints
test(factures): vérifie qu'une facture émise ne peut pas être modifiée
```

Le format est vérifié par le crochet `../../../Téléchargements/conventions/.githooks/commit-msg` (installation en section 5).

## 4. Merge requests et revues

- Une merge request par issue. Son titre suit le même format qu'un message de commit.
- Elle est **relue et approuvée par un autre membre que son auteur** avant d'être fusionnée. Le pipeline doit être vert.
- Le modèle `../../../Téléchargements/conventions/.gitlab/merge_request_templates/Default.md` fournit la liste de vérification de la revue.
- La personne qui relit vérifie au minimum :
  - le respect du DAT et des ADR (couches, SQL dans les dépôts, droits dans l'API) ;
  - les requêtes SQL paramétrées ;
  - l'absence de secret dans le code ;
  - la présence de tests pour le nouveau comportement ;
  - les noms, qui suivent ce fichier ;
  - la mise à jour du DAT si l'architecture change.
- Les remarques se font dans GitLab, sur la ligne concernée. L'auteur répond à chaque remarque ou la corrige avant la fusion.
- Une contribution importante de l'IA est signalée dans la description de la merge request.

## 5. Installer les outils (une fois par poste)

```bash
git config core.hooksPath .githooks     # active la vérification des messages de commit
git config commit.template .gitmessage  # affiche le modèle dans l'éditeur au moment du commit
```

Avec Claude Code, la commande `/commit` propose un message conforme à partir des changements indexés (`../../../Téléchargements/conventions/.claude/commands/commit.md`).
