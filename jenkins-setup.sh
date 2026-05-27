#!/usr/bin/env bash
set -e

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found in PATH."
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx 'jenkins'; then
  echo "Jenkins container is already running. Nothing to do."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx 'jenkins'; then
  echo "Removing existing stopped Jenkins container..."
  docker rm jenkins
fi

docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

echo "Waiting for Jenkins to be ready..."
until curl -s http://localhost:8080/login >/dev/null; do
  echo "Waiting for Jenkins to be ready..."
  sleep 5
done

docker exec -u 0 jenkins bash -lc "apt-get update && apt-get install -y curl ca-certificates gnupg"
docker exec -u 0 jenkins bash -lc "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
docker exec -u 0 jenkins bash -lc "apt-get install -y nodejs docker.io"
docker exec -u 0 jenkins bash -lc "chmod 666 /var/run/docker.sock"

echo "Jenkins is ready at http://localhost:8080"
