FROM oven/bun:1-slim

WORKDIR /app

# Install dependencies by copying package.json and lockfile from the frontend subfolder
COPY frontend/package.json frontend/bun.lock /app/
RUN bun install --frozen-lockfile

# Copy the rest of the frontend source files into the container
COPY frontend /app/

# Expose Bun.serve port
EXPOSE 3000

# Set production environment by default
ENV NODE_ENV=production
ENV BACKEND_URL=http://backend:8000

# Start Bun application
CMD ["bun", "run", "start"]
