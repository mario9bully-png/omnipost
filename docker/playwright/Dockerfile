FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /data/browser-contexts

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3500

ENTRYPOINT ["/app/entrypoint.sh"]
