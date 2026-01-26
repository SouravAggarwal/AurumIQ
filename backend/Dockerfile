# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY backend/ /app/

# Collect static files
# Create directory for static files if it doesn't exist (handled by collectstatic usually, but good to ensure permissions)
RUN python manage.py collectstatic --noinput

# Expose port (Render sets PORT env var, but 8000 is common default)
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "aurumiq.wsgi:application", "--bind", "0.0.0.0:8000"]
