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

ENTRYPOINT ["/entrypoint.sh"]
