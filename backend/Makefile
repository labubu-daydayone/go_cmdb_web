.PHONY: help build run test clean migrate seed dev

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the server binary
	@echo "Building server..."
	@go build -o bin/cdn-control-server cmd/server/main.go
	@echo "Build complete: bin/cdn-control-server"

run: ## Run the server
	@echo "Starting server..."
	@go run cmd/server/main.go

dev: ## Run server with hot reload (requires air)
	@echo "Starting development server with hot reload..."
	@air

test: ## Run tests
	@echo "Running tests..."
	@go test -v ./...

migrate: ## Run database migrations
	@echo "Running database migrations..."
	@go run cmd/server/main.go --migrate

seed: ## Seed default data
	@echo "Seeding default data..."
	@go run cmd/server/main.go --seed

migrate-seed: ## Run migrations and seed data
	@echo "Running migrations and seeding data..."
	@go run cmd/server/main.go --migrate --seed

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@echo "Clean complete"

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@go mod download
	@echo "Dependencies downloaded"

tidy: ## Tidy go.mod
	@echo "Tidying go.mod..."
	@go mod tidy
	@echo "Tidy complete"

fmt: ## Format code
	@echo "Formatting code..."
	@go fmt ./...
	@echo "Format complete"

lint: ## Run linter (requires golangci-lint)
	@echo "Running linter..."
	@golangci-lint run
	@echo "Lint complete"

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	@docker build -t cdn-control-panel:latest .
	@echo "Docker image built"

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	@docker run -p 8080:8080 --env-file .env cdn-control-panel:latest

.DEFAULT_GOAL := help
