FROM node:20-alpine

WORKDIR /app/frontend

# Install dependencies (no build at image build time).
# In development, source will be bind-mounted and will override the copied code.
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy application source so that production builds can run inside the container.
# In development, this will be overlaid by the bind mounts from docker-compose.yml.
COPY frontend .
COPY shared /app/shared

EXPOSE 3000

# Default environment; can be overridden at runtime (e.g. APP_ENV=production)
ENV APP_ENV=development

COPY frontend/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Default command delegates to entrypoint, which chooses dev or prod based on APP_ENV.
CMD ["./entrypoint.sh"]
