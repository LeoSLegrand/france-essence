# jenkins-setup.ps1
$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is required but was not found in PATH."
    exit 1
}

$running = docker ps --format '{{.Names}}' | Where-Object { $_ -eq 'jenkins' }
if ($running) {
    Write-Host "Jenkins container is already running. Nothing to do."
    exit 0
}

$exists = docker ps -a --format '{{.Names}}' | Where-Object { $_ -eq 'jenkins' }
if ($exists) {
    Write-Host "Removing existing stopped Jenkins container..."
    docker rm jenkins
}

docker run -d `
    --name jenkins `
    -p 8080:8080 `
    -p 50000:50000 `
    -v jenkins_home:/var/jenkins_home `
    -v /var/run/docker.sock:/var/run/docker.sock `
    jenkins/jenkins:lts

Write-Host "Waiting for Jenkins to be ready..."
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/login" -UseBasicParsing -ErrorAction Stop
        break
    } catch {
        Write-Host "Still waiting..."
        Start-Sleep -Seconds 5
    }
}

docker exec -u 0 jenkins bash -lc "apt-get update && apt-get install -y curl ca-certificates gnupg"
docker exec -u 0 jenkins bash -lc "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
docker exec -u 0 jenkins bash -lc "apt-get install -y nodejs docker.io"
docker exec -u 0 jenkins bash -lc "chmod 666 /var/run/docker.sock"

Write-Host "Jenkins is ready at http://localhost:8080"