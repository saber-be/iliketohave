FROM node:20-alpine

WORKDIR /app/frontend

# Install dependencies only (no build). Source code will be bind-mounted in compose.
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

EXPOSE 3000

# Default dev command; you can override or run other tools (e.g. npx webpack -w) via docker compose exec.
CMD ["npm", "run", "dev"]
