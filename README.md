# Application de gestion de festival

Application web de gestion d'un festival de jeux de société : festivals et zones tarifaires, exposants, éditeurs et distributeurs, catalogue de jeux, réservations de tables avec calcul automatique du prix, placement des jeux sur le plan, facturation et suivi des paiements, et un workflow de suivi des exposants, du premier contact à la facture payée.

Projet AWI 2026-2027, Polytech Montpellier, groupe 11.

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Technologies](#technologies)
3. [Démarrage](#démarrage)
4. [Déploiement](#déploiement)
5. [Organisation du dépôt](#organisation-du-dépôt)
6. [Documentation](#documentation)
7. [Équipe et rôles](#équipe-et-rôles)
8. [Méthode de travail](#méthode-de-travail)
9. [Utilisation de l'IA](#utilisation-de-lia)

## Fonctionnalités

L'application est utilisée par les membres de l'association, avec des rôles hiérarchiques : administrateur, commercial, gestionnaire de plan, gestionnaire de jeux, membre de l'organisation, plus le rôle de trésorier, qui s'ajoute aux autres. Le visiteur consulte la liste des festivals sans compte. Les exposants, éditeurs, distributeurs et auteurs sont des données gérées dans l'application : ils n'ont pas de compte.

- **Festivals** : liste sous forme de cartes (nom, tables disponibles au total et par zone), création avec un nom unique, copie d'un festival précédent, choix du festival courant (par défaut le dernier créé).
- **Zones tarifaires et zones du plan** : capacité en tables, prix de la table, remise de précommande ; chaque zone du plan est rattachée à une zone tarifaire. Une surface demandée en m² est convertie en tables.
- **Structures** : éditeurs, distributeurs et exposants, avec leurs contacts. Une même structure peut cumuler plusieurs rôles.
- **Exposants** : la structure qui réserve des tables sur un festival. Ce n'est pas forcément un éditeur : ce peut être un prestataire, ou l'association elle-même (réservation non facturée).
- **Jeux** : catalogue triable, règles en PDF.
- **Réservations** : tables réservées dans une ou plusieurs zones tarifaires, prix calculé automatiquement, remises (précommande, tables offertes ou montant), repas, puis jeux présentés et leur place sur le plan.
- **Workflow de suivi** : dates de contact, statuts de « pas encore contacté » à « présent », liste de jeux demandée, obtenue et reçue.
- **Facturation** : factures PDF créées par le trésorier et jamais modifiées (une correction passe par une annulation), paiements en plusieurs fois, reste à payer.

Exigences non fonctionnelles : ergonomie, robustesse (aucune surréservation, factures immuables, toutes les actions datées) et environ 1 000 visiteurs en lecture (chiffre à faire confirmer par le client).

## Technologies

| Couche | Technologie |
|---|---|
| Front-end | Angular 22 (composants standalone, signaux, `inject()`, `@if` / `@for`), servi par nginx |
| Back-end | Node.js 24, TypeScript, Express 5 ; validation avec `zod`, PDF avec PDFKit |
| Base de données | PostgreSQL 18, avec le pilote `pg`, sans ORM : requêtes SQL écrites à la main et paramétrées |
| Environnement | Docker et Docker Compose (seuls outils à installer) |
| CI/CD | GitLab CI/CD, déploiement sur la VM du groupe |

Les choix et leurs justifications sont détaillés dans le DAT et ses ADR (voir [Documentation](#documentation)).

## Démarrage

### Prérequis

Docker, avec Docker Compose. Rien d'autre n'est à installer.

### Lancer le projet en développement

```bash
git clone https://gitlab.polytech.umontpellier.fr/mathieu.marty/awi_kim_mathieu_ines.git
cd awi_kim_mathieu_ines
cp .env.example .env      # adapter les valeurs si besoin
docker compose up --build
```

Puis ouvrir :

- l'application : `http://localhost:4200` ;
- l'API : `http://localhost:3000/api/v1` (test de santé : `http://localhost:3000/api/v1/sante`) ;
- PostgreSQL est exposé en local sur le port `5432`.

Au démarrage, l'API applique les migrations SQL qui manquent (dossier `db/migrations`).

Pour arrêter :

```bash
docker compose down        # ajouter -v pour supprimer aussi le volume de la base
```

### Lancer les tests

```bash
docker compose run --rm api npm test
```

## Déploiement

L'application est déployée sur la VM du groupe (`162.38.111.31`), joignable depuis le réseau de Polytech ou par le VPN de l'école.

- Le pipeline GitLab construit les images, les pousse dans le registre du projet (étiquetées par le SHA du commit), puis le job `deploy` se connecte à la VM en SSH et relance les conteneurs.
- Sur la VM, Docker fonctionne en mode rootless, sous le compte `mathieu.marty`.
- Retour arrière : relancer le job manuel `rollback` avec l'étiquette d'une version précédente (`TAG=<sha>`).
- Sauvegarde : un `pg_dump` quotidien de la base et une archive des PDF de règles, conservés 14 jours.

Le détail est dans les sections 7 et 8 du DAT.

## Organisation du dépôt

```
.
├── README.md
├── CLAUDE.md               # instructions données à l'assistant IA (voir « Utilisation de l'IA »)
├── docs/
│   ├── DAT.tex, DAT.pdf    # Document d'Architecture Technique
│   ├── ADR-registre.tex, ADR-registre.pdf
│   ├── besoin.tex, besoin.pdf   # document de besoin, qui fait référence
│   ├── preambule.tex, adr-fiches.tex, besoins-contenu.tex, entrevues-table.tex
│   ├── logos/
│   └── adr/                # une fiche par ADR
├── frontend/               # application Angular
├── api/                    # API Node.js, TypeScript, Express
├── db/
│   └── migrations/         # scripts SQL numérotés (001_initial.sql…)
├── docker-compose.yml      # développement
├── docker-compose.prod.yml # production (images du registre)
└── .gitlab-ci.yml          # pipeline CI/CD
```

> À ajuster si la structure réelle du dépôt est différente.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/besoin.pdf`](docs/besoin.pdf) | Besoin du client : notes d'entrevues, besoins, règles de gestion, questions ouvertes. Il fait référence en cas de désaccord avec le client. |
| [`docs/DAT.pdf`](docs/DAT.pdf) | Architecture : contraintes, diagrammes C4, modèle de données, sécurité, déploiement, CI/CD, ADR, journal des évolutions |
| [`docs/ADR-registre.pdf`](docs/ADR-registre.pdf) | Toutes les décisions d'architecture, avec leurs critères, leurs options et leurs conséquences |

Les documents sont rédigés en LaTeX, avec l'accord de l'enseignant : les sources `.tex` sont dans `docs/`, avec les PDF compilés. Pour recompiler, lancer `pdflatex DAT.tex` deux fois dans `docs/` (même chose pour `ADR-registre.tex` et `besoin.tex`).

Le DAT est versionné par des tags Git : `dat-v1` pour la version initiale, puis un tag par version suivante (`dat-v1.1`…). Chaque changement est noté dans le journal des évolutions du DAT, en distinguant les évolutions décidées des écarts subis.

## Équipe et rôles

| Rôle | Responsable | Responsabilité |
|---|---|---|
| Relation client et besoin | toute l'équipe | prépare les entrevues, tient à jour le document de besoin, vérifie la conformité fonctionnelle |
| Architecture | Ines Mazgar | garantit le DAT et sa cohérence avec le code |
| Déploiement | Mathieu Marty | garantit l'environnement Docker, le pipeline CI/CD et le déploiement sur la VM |
| Qualité | Kim Etienne | garantit les tests, les revues de code et les conventions |

Chaque membre code dans toutes les couches (front-end, API, base de données).

## Méthode de travail

- La branche `main` est protégée : aucun push direct. Le développement se fait sur des branches de fonctionnalité.
- Chaque tâche a une issue GitLab. Chaque changement passe par une merge request, relue et approuvée par un autre membre que son auteur.
- Les messages de commit sont explicites (par exemple `feat(reservations): calcul du prix avec remise`).
- Le pipeline lance le lint et les tests sur chaque branche et chaque merge request ; un échec bloque la fusion. Seule la branche `main` déclenche la construction des images et le déploiement.

## Utilisation de l'IA

L'énoncé autorise les assistants IA, à condition que l'équipe décide et maîtrise tout ce qui est livré.

- **Outils** : Claude (Anthropic), utilisé dans l'interface claude.ai. *À compléter : autres outils utilisés par chaque membre, par exemple un assistant de code dans l'éditeur.*
- **Tâches** :
  - restructuration du DAT selon la trame et relecture de sa cohérence avec l'énoncé ;
  - rédaction d'ADR à partir des options discutées en équipe ;
  - dessin des diagrammes en TikZ ;
  - explications techniques (sécurité, SQL, déploiement) ;
  - aide au code et aux revues.
- **Vérifications** :
  - tout contenu produit par l'IA est relu, vérifié et adapté par un membre avant d'être commité ;
  - les PDF sont recompilés et relus ;
  - les ADR proposés par l'IA restent au statut « Proposée » jusqu'à leur relecture et leur acceptation par l'équipe ;
  - le code suit le circuit normal des merge requests, relues par un humain.
- **Décisions** : les choix d'architecture, l'interprétation du besoin et les échanges avec le client relèvent de l'équipe, pas de l'IA.
- **Instructions** : le fichier `CLAUDE.md`, à la racine, contient les consignes données à l'assistant de codage.
- **Traçabilité** : une contribution importante de l'IA est signalée dans la description de la merge request.