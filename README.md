# Festival Management Application

Web application to manage a board game festival: festivals and pricing zones, exhibitors, publishers and distributors, games, table reservations with automatic price computation, and a follow-up workflow from the first contact to the paid invoice.

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Project structure](#project-structure)
5. [Documentation](#documentation)
6. [Team and roles](#team-and-roles)
7. [Development workflow](#development-workflow)
8. [Use of AI](#use-of-ai)

## Features

The application is used by the festival organizers. Exhibitors, publishers, distributors and authors are business entities managed by the organizers, not users of the site.

- **Festivals**: list as cards (name, total tables, tables per pricing zone), creation with a unique name, selection of the current festival (the latest created by default)
- **Pricing zones and plan zones**: tables, table price, price per m², mapping between plan zones and pricing zones
- **Publishers and distributors**: lists with sorting, contacts, games. A company can be both a publisher and a distributor
- **Exhibitors**: the entity that books tables at the festival; it is different from a publisher
- **Reservations**: tables booked in one or several pricing zones, automatic price, global discounts (free tables or amount), games and their plan zone
- **Follow-up workflow**: contact dates, states from "no contact yet" to "invoice paid", game list requested/obtained/received

Non-functional requirements: ergonomics, robustness, and about 1,000 read-only clients.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | PostgreSQL with the `pg` driver |
| Frontend | See the DAT (`DAT.md`) |
| Environment | Docker (the only tool to install) |
| CI/CD | GitLab CI/CD pipelines |

## Getting started

### Prerequisites

Docker (with Docker Compose). Nothing else needs to be installed on the machine.

### Run the project

```bash
git clone <repository-url>
cd <repository-folder>
cp .env.example .env      # adjust the values if needed
docker compose up --build
```

Then open the frontend at `http://localhost:<frontend-port>`. The API is available at `http://localhost:<api-port>`.

To stop the stack:

```bash
docker compose down        # add -v to also remove the database volume
```

> Replace the placeholders (`<repository-url>`, ports) once the Docker setup is finished.

### Run the tests

```bash
docker compose run --rm api npm test
```

## Project structure

```
.
├── README.md
├── DAT.md                 # Technical Architecture Document (tag dat-v1 for the first version)
├── system-prompt.md       # Instructions file for the AI assistant
├── docs/
│   └── besoin.md          # Requirements document
├── frontend/              # Frontend application
├── api/                   # Node.js + Express.js API
├── db/                    # PostgreSQL initialization and migration scripts
├── docker-compose.yml
└── .gitlab-ci.yml         # CI/CD pipeline
```

> Adjust this tree to the real structure of the repository.

## Documentation

| Document | Content |
|---|---|
| [`docs/besoin.md`](docs/besoin.md) | Requirements, written before the code |
| [`DAT.md`](DAT.md) | Architecture choices, requirements, roles, and the evolution log |
| `system-prompt.md` | Instructions given to the AI assistant |

The DAT is versioned: the first version is tagged `dat-v1`. Every later change is recorded in its "Evolutions" section with the decision taken and any gap suffered compared with the initial version.

## Team and roles

| Member | Main responsibility |
|---|---|
| Kim Etienne | Architecture |
| Ines Mazgar | Architecture |
| Mathieu Marty | Deployment |

| Role | Responsibility |
|---|---|
| Client relationship and requirements | Prepares the interviews, keeps the requirements document up to date, checks functional conformity (everyone) |
| Architecture | Guarantees the DAT and its consistency with the code |
| Deployment | Guarantees the Docker environment, the CI/CD pipeline and the deployment on the VM |
| Quality | Guarantees tests, code reviews and conventions (everyone) |

Every member codes in all layers (frontend, API, database).

## Development workflow

- The `main` branch is protected; development happens on `develop` and on feature branches created from it.
- Every task has a GitLab issue. Each change goes through a merge request with review comments from another member.
- Commit messages follow the rules of the commit instructions file.
- The CI/CD pipeline runs on every merge request; a failing pipeline blocks the merge.

## Use of AI

This project uses an AI assistant (Claude) as a support tool. The rules are the following:

- **What AI is used for**: drafting and structuring documentation (table of contents of the DAT, issue lists, diagrams of entities and relationships), and helping with code and reviews.
- **Instructions**: the assistant is guided by the `system-prompt.md` file at the root of the repository.
- **Human responsibility**: every AI-generated content is read, checked and adapted by a team member before being committed. Merge requests are reviewed by a human, whatever the origin of the code.
- **Decisions**: architecture decisions, requirement choices and exchanges with the client are made by the team, not by the AI.
- **Traceability**: significant AI contributions are mentioned in the merge request description.

> Complete this section with the exact tools, models and practices of the team.