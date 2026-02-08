# eGolf Reboot — Makefile
# Run from the reboot/ directory

BACKEND_DIR  = backend
FRONTEND_DIR = frontend
VENV         = $(BACKEND_DIR)/.venv
PIP          = $(VENV)/bin/pip
PYTHON       = $(VENV)/bin/python
UVICORN      = $(VENV)/bin/uvicorn

.PHONY: help install install-backend install-frontend \
        run-backend run-frontend run \
        migrate migrate-up migrate-down migrate-status \
        typecheck clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Install ──────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: $(VENV)/bin/activate ## Install backend dependencies
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt

$(VENV)/bin/activate:
	python3 -m venv $(VENV)

install-frontend: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

# ── Run ──────────────────────────────────────────────────

run-backend: ## Start the FastAPI backend (port 8000)
	cd $(BACKEND_DIR) && $(abspath $(UVICORN)) main:app --reload --port 8000

run-frontend: ## Start the Vite dev server (port 5173)
	cd $(FRONTEND_DIR) && npm run dev

run: ## Start both backend and frontend (requires two terminals)
	@echo "Start each in a separate terminal:"
	@echo "  make run-backend"
	@echo "  make run-frontend"

# ── Migrations ───────────────────────────────────────────

migrate: ## Apply all pending migrations
	cd $(BACKEND_DIR) && $(abspath $(PYTHON)) migrate.py

migrate-up: ## Apply the next pending migration
	cd $(BACKEND_DIR) && $(abspath $(PYTHON)) migrate.py --up

migrate-down: ## Rollback the last applied migration
	cd $(BACKEND_DIR) && $(abspath $(PYTHON)) migrate.py --down

migrate-status: ## Show migration status
	cd $(BACKEND_DIR) && $(abspath $(PYTHON)) migrate.py --status

# ── Utilities ────────────────────────────────────────────

typecheck: ## Run TypeScript type checking on the frontend
	cd $(FRONTEND_DIR) && npx vue-tsc --noEmit

clean: ## Remove generated files (venv, node_modules, db)
	rm -rf $(VENV)
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -f $(BACKEND_DIR)/egolf.db
