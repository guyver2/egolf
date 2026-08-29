.PHONY: help build run test migrate migrate-status docker-build docker-up docker-down clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

build: ## Build release binary
	cargo build --release

run: ## Run dev server (port 8080)
	cargo run

test: ## Run tests
	cargo test

migrate: ## Apply pending migrations
	cargo run -- migrate

migrate-status: ## Show migration status
	cargo run -- migrate --status

docker-build: ## Build Docker image
	docker compose build

docker-up: ## Start Docker container
	docker compose up -d

docker-down: ## Stop Docker container
	docker compose down

clean: ## Remove build artifacts and local db
	cargo clean
	rm -f egolf.db
	rm -rf terrain_cache
