#!/bin/bash

# Generate Swagger documentation

echo "Generating Swagger documentation..."

# Check if swag is installed
if ! command -v swag &> /dev/null; then
    echo "Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
fi

# Generate swagger docs
cd "$(dirname "$0")/.." || exit 1
swag init -g cmd/serve.go -o docs --parseDependency --parseInternal

echo "✓ Swagger documentation generated successfully"
echo "  Output: docs/swagger.json, docs/swagger.yaml"
