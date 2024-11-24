#!/usr/bin/env bash

set -e

port=9718
max_attempts=30
timeout=1

# Function to check if port is in use
is_port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
    return $?
}

# Function to cleanup background processes
cleanup() {
    if [ -n "$WRANGLER_PID" ]; then
        echo "Cleaning up Wrangler process..."
        kill $WRANGLER_PID 2>/dev/null || true
        wait $WRANGLER_PID 2>/dev/null || true
    fi
}

# Function to check if server is responding
check_server() {
    curl -s "http://localhost:$1/cv" >/dev/null 2>&1
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

echo "Building Astro site..."
bun x astro build

# Check if port is already in use
if is_port_in_use $port; then
    echo "Error: Port $port is already in use"
    exit 1
fi

echo "Starting Wrangler server on port $port..."
bun x wrangler pages dev --port=$port ./dist &
WRANGLER_PID=$!

echo "Waiting for server to be ready..."
attempt=0
while ! check_server $port; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "Error: Server failed to start after $max_attempts attempts"
        exit 1
    fi
    echo "Attempt $attempt of $max_attempts - Server not ready, waiting..."
    sleep $timeout
done

echo "Server is ready, generating PDF..."
if ! node ./scripts/create-pdf.mjs --output "./public/doichev-kostiantyn-full-stack.pdf" --url "http://localhost:$port/cv"; then
    echo "Error: PDF generation failed"
    exit 1
fi

echo "PDF generated successfully"

echo "Rebuilding Astro site..."
bun x astro build

echo "Script completed successfully"
