# Arthetic: User service

A User service of Arthetic's microservice, and should only be running as a Apollo subgraph.

# Prerequisites

- Node Version : 18

# Environment Setup

Before running the service, ensure that you have set up the required environment variables. Create a .env file in the root of your project and include the following variables:

```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
SALT_ROUNDS=
PORT=
```

# Installation

```
pnpm install
```

# Running Migrations

```
pnpm migrate
```

# Start

```
pnpm run dev
```
