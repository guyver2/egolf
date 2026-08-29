FROM rust:1.91-bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
COPY templates ./templates
COPY assets ./assets
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/egolf /usr/local/bin/egolf
COPY migrations ./migrations
COPY templates ./templates
COPY assets ./assets
ENV DATABASE_PATH=/data/egolf.db
ENV TERRAIN_CACHE_DIR=/data/terrain_cache
ENV PORT=8080
EXPOSE 8080
CMD ["egolf"]
