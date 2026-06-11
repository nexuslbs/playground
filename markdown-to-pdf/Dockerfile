FROM python:3.11-slim

# Install pandoc and system dependencies for weasyprint
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    libcairo2 \
    libpangoft2-1.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Install weasyprint for PDF generation
RUN pip install --no-cache-dir weasyprint

# Copy assets and entrypoint
COPY assets/style.css /assets/style.css
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose as a CLI command for exec / docker compose run usage
RUN ln -s /entrypoint.sh /usr/local/bin/md-to-pdf

# No ENTRYPOINT — uses CMD so docker-compose can override with "sleep infinity"
# Usage: docker compose exec md-pdf md-to-pdf <input.md> <output.pdf>
CMD ["sleep", "infinity"]
