# France Essence API

A powerful Node.js backend providing REST and GraphQL APIs for tracking real-time and historical fuel prices across France, as well as managing user fuel spending.

## 🚀 Features

-   **⛽ Fuel Data Integration:** Automated imports of French government open data for thousands of fuel stations.
-   **🔌 REST API:** Comprehensive endpoints for stations, users, vehicles, and authentication.
-   **📊 GraphQL API:** Read-only analytical endpoints for historical price series and user spending trends (accessible at `/graphql`).
-   **🛡️ Type-Safe:** Built entirely with TypeScript and Prisma ORM.
-   **🧪 Tested:** Extensive unit and integration test coverage utilizing Vitest and Supertest.

## 🛠️ Tech Stack

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** SQLite (via Prisma)
-   **API Design:** REST & GraphQL
-   **Testing:** Vitest

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd france-essence
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Generate the Prisma Client and set up the local database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Deeper Documentation

For a comprehensive deep dive into the project's architecture, historical decisions, data structures, and overall strategy, please refer to the [Projet Overview](./Projet%20Overview.md) file.

## 🧑‍💻 Development

Run the test suite to ensure everything is working correctly:
```bash
npm run test
```
