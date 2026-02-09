FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Data directories — mount volumes here for persistence
RUN mkdir -p /data /app/terrain_cache
ENV DATABASE_PATH=/data/egolf.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
