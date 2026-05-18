# France Essence API

Une API Node.js qui expose des endpoints REST et GraphQL pour suivre les prix des carburants en France (temps reel et historique) et les depenses des utilisateurs.

## 🚀 Fonctionnalites

-   **Import des donnees carburant:** Integration automatisee des donnees publiques (stations, prix).
-   **API REST:** Endpoints pour stations, utilisateurs, vehicules et authentification.
-   **API GraphQL:**
    - Endpoints analytiques en lecture seule pour series de prix et depenses utilisateur (accessible via `/graphql`).
    - Une interface GraphiQL est disponible en environnement de developpement sur `/graphql/ui`.
-   **Tests:** Couverture unite et integration avec Vitest et Supertest.

## 🛠️ Stack technique

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Base de donnees:** PostgreSQL (via Prisma)
-   **API:** REST & GraphQL
-   **Tests:** Vitest

## 🏁 Demarrage rapide

### Prerequis

-   Node.js (v18 ou plus)
-   npm
-   Docker (pour PostgreSQL local)

### Installation

1. Cloner le depot et entrer dans le dossier:
   ```bash
   git clone https://github.com/LeoSLegrand/france-essence/
   cd france-essence
   ```

2. Creer le fichier d environnement local:
   ```bash
   cp .env.example .env
   ```

3. Demarrer PostgreSQL (local via Docker):
   ```bash
   docker compose up -d db
   ```

4. Installer les dependances:
   ```bash
   npm install
   ```

5. Generer le client Prisma et initialiser la base locale:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. Lancer le serveur de developpement:
   ```bash
   npm run dev
   ```

## 🐳 Docker Compose (API + DB)

Le fichier [docker-compose.yml](docker-compose.yml) orchestre l API et PostgreSQL.

1. Creer le fichier d environnement local:
   ```bash
   cp .env.docker.example .env.docker
   ```

2. Construire et initialiser la base:
   ```bash
   docker compose --env-file .env.docker build
   docker compose --env-file .env.docker run --rm api npx prisma migrate deploy
   ```

3. Lancer l ensemble:
   ```bash
   docker compose --env-file .env.docker up
   ```

## 📖 Documentation detaillee

Pour une vue complete de l'architecture et des choix techniques, voir [Projet Overview](./Projet%20Overview.md).

## 🧑‍💻 Developpement

Lancer les tests:
```bash
npm run test
```
