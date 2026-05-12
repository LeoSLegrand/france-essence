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
-   **Base de donnees:** SQLite (via Prisma)
-   **API:** REST & GraphQL
-   **Tests:** Vitest

## 🏁 Demarrage rapide

### Prerequis

-   Node.js (v18 ou plus)
-   npm

### Installation

1. Cloner le depot et entrer dans le dossier:
   ```bash
   git clone https://github.com/LeoSLegrand/france-essence/
   cd france-essence
   ```

2. Installer les dependances:
   ```bash
   npm install
   ```

3. Generer le client Prisma et initialiser la base locale:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Lancer le serveur de developpement:
   ```bash
   npm run dev
   ```

## 🐳 Docker (API)

1. Construire l image:
   ```bash
   docker build -t france-essence-api .
   ```

2. Creer un fichier d environnement local (non versionne):
   ```bash
   cp .env.docker.example .env.docker
   ```

3. Initialiser la base (premier lancement):
   ```bash
   docker run --rm --env-file .env.docker -v france-essence-data:/app/prisma france-essence-api npx prisma migrate deploy
   ```

4. Lancer l API:
   ```bash
   docker run --rm -p 3000:3000 --env-file .env.docker -v france-essence-data:/app/prisma france-essence-api
   ```

## 🐳 Docker Compose (API + futur DB)

1. Creer le fichier d environnement local:
   ```bash
   cp .env.docker.example .env.docker
   ```

2. Construire et lancer:
   ```bash
   docker compose build
   docker compose run --rm api npx prisma migrate deploy
   docker compose up
   ```

## 📖 Documentation detaillee

Pour une vue complete de l'architecture et des choix techniques, voir [Projet Overview](./Projet%20Overview.md).

## 🧑‍💻 Developpement

Lancer les tests:
```bash
npm run test
```
