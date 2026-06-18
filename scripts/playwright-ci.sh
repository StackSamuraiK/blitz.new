#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting Playwright E2E Tests ==="

# Start backend server in background
echo "Starting backend on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend server in background
echo "Starting frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both servers to be ready
echo "Waiting for servers to be ready..."
npx wait-on http://localhost:5173 http://localhost:3000/health --timeout 60000

# Run Playwright tests
echo "Running Playwright tests..."
npx playwright test

# Capture exit code
EXIT_CODE=$?

# Cleanup: kill servers
echo "Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true

echo "=== Playwright E2E Tests Complete (exit code: $EXIT_CODE) ==="
exit $EXIT_CODE
