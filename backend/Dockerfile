# HomePilot backend – minimal runnable image
FROM python:3.12-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/
COPY tests/ tests/
COPY alembic/ alembic/
COPY alembic.ini .

# Run from project root so `app` package resolves
ENV PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Startup script to run migrations then start server
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e
echo "Running database migrations..."
alembic upgrade head || echo "Migration failed or not needed"
echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
EOF

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
