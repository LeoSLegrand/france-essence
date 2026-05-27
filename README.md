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

3. Lancer l'ensemble (API + DB) via Docker Compose:
   ```bash
   docker compose up -d --build
   ```

Le conteneur API applique les migrations (`prisma migrate deploy`) au demarrage.

### Developpement local (API hors Docker)

Pour lancer uniquement PostgreSQL en Docker et executer l API en local:

1. Demarrer PostgreSQL:
   ```bash
   docker compose up -d db
   ```

2. Mettre a jour `DATABASE_URL` dans `.env` pour pointer sur localhost:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/france_essence?schema=public
   ```

3. Installer les dependances:
   ```bash
   npm install
   ```

4. Generer le client Prisma et initialiser la base locale:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Lancer le serveur de developpement:
   ```bash
   npm run dev
   ```

## 🐳 Docker Compose (API + DB)

Le fichier [docker-compose.yml](docker-compose.yml) orchestre l API et PostgreSQL.
Le demarrage se fait directement avec `.env`.

## 📖 Documentation detaillee

Pour une vue complete de l'architecture et des choix techniques, voir [Projet Overview](./Projet%20Overview.md).

## 🧑‍💻 Developpement

Lancer les tests:
```bash
npm run test
```
