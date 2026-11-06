FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential for C-extensions/math packages, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

ENV OSRM_BASE_URL=http://osrm:5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

