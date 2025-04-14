#!/bin/bash
set -euo pipefail

# 🏗️ Build Angular project from root
echo ""
echo "🏗️ Running Angular build from project root..."
echo ""
cd ..
npm run build
cd server

# CONFIG
IMAGE_NAME="masonhirst/masonhirstgithubio-server"
VERSION=$(date +%Y.%m.%d.%H%M)
DOCKER_WAS_STARTED=false
MAX_WAIT=30  # seconds

# Spinner function
show_spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while kill -0 "$pid" 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
}

echo ""
echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀 Starting Docker deploy script! 🚀🚀🚀🚀🚀🚀🚀🚀🚀"
echo ""

# 🐳 If Docker isn't running, try to start it
if ! docker info > /dev/null 2>&1; then
  echo "🐳 Docker is not running. Attempting to start Docker Desktop..."
  open -a Docker
  DOCKER_WAS_STARTED=true

  echo -n "⏳ Waiting for Docker to become responsive..."
  SECONDS_WAITED=0
  until docker info --format '{{.ServerVersion}}' > /dev/null 2>&1; do
    sleep 1
    ((SECONDS_WAITED++))
    printf "."
    if [ "$SECONDS_WAITED" -ge "$MAX_WAIT" ]; then
      echo ""
      echo "🚫 Docker did not become responsive after $MAX_WAIT seconds."
      echo "🧊 Docker may be frozen or stuck starting up."
      echo "🔁 Please quit Docker Desktop manually, reopen it, and then re-run this script."
      echo ""
      exit 1
    fi
  done
  echo ""
  echo "✅ Docker is now running and responsive."
fi

# 🧪 Confirm Docker is ready to build
echo -n "🧪 Verifying Docker daemon is ready for actual builds..."
(
  MAX_WAIT_BUILD=20
  SECONDS_WAITED=0
  while true; do
    echo "FROM scratch" | docker build -t dummy-check - > /dev/null 2>&1 && break
    sleep 1
    ((SECONDS_WAITED++))
    if [ "$SECONDS_WAITED" -ge "$MAX_WAIT_BUILD" ]; then
      echo ""
      echo "🚫 Docker is still not ready to build images after $MAX_WAIT_BUILD seconds."
      echo "🔁 Please restart Docker Desktop and try again."
      echo ""
      exit 1
    fi
  done
) &
show_spinner $!
echo ""
echo "✅ Docker is ready to build."

# 🔧 Build Docker image
echo "🔧 Building Docker image: $IMAGE_NAME:$VERSION"
docker build -t $IMAGE_NAME:$VERSION .

# 🏷️ Tag as latest
echo "🏷️ Tagging as latest"
docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

# 📤 Push versioned tag
echo "📤 Pushing $VERSION to Docker Hub..."
(docker push $IMAGE_NAME:$VERSION) &
show_spinner $!
if ! wait $!; then
  echo ""
  echo "❌ Failed to push $IMAGE_NAME:$VERSION"
  echo "🔐 You may not be logged in or the repo may not exist."
  echo "👉 Run 'docker login' and verify that the repository '$IMAGE_NAME' exists on Docker Hub."
  echo ""
  EXIT_AFTER=true
fi

# 📤 Push latest tag
echo "📤 Pushing latest to Docker Hub..."
(docker push $IMAGE_NAME:latest) &
show_spinner $!
if ! wait $!; then
  echo ""
  echo "❌ Failed to push $IMAGE_NAME:latest"
  echo "🔐 You may not be logged in or the repo may not exist."
  echo "👉 Run 'docker login' and verify that the repository '$IMAGE_NAME' exists on Docker Hub."
  echo ""
  EXIT_AFTER=true
fi

if [ "${EXIT_AFTER:-false}" = false ]; then
  echo "✅ Done: attempted push of $IMAGE_NAME:$VERSION and latest"
fi

# 🚪 Quit Docker if we started it
if [ "$DOCKER_WAS_STARTED" = true ]; then
  echo "🛑 Attempting to quit Docker Desktop..."
  osascript -e 'quit app "Docker Desktop"' || osascript -e 'quit app "Docker"'
  sleep 3

  if pgrep -xq "Docker Desktop" || pgrep -xq "Docker"; then
    echo "⚠️ Docker Desktop app is still running (menu bar icon present)."
  else
    echo "🚪 Docker Desktop fully closed."
  fi
fi

# ⛔ Exit with error code if we hit a push failure
if [ "${EXIT_AFTER:-false}" = true ]; then
  exit 1
fi