# ------ Builder Stage ------
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Install global dependencies
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install project dependencies
RUN pnpm install

# Copy everything else
COPY . .

# Generate prisma client
RUN pnpx prisma generate

# Build the project
RUN pnpm build

# ------ Final Stage ------
FROM node:18-bullseye-slim AS final
WORKDIR /app

# Install global dependencies
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
COPY wait-for.sh wait-for.sh

# Install only production dependencies
RUN pnpm install --production

# Expose port
EXPOSE 4000

# Command to run the application
CMD ["pnpm", "start:migrate"]
