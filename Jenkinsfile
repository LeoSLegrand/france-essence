pipeline {
  agent {
    docker {
      image 'node:20-bullseye'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
      reuseNode true
    }
  }

  triggers { pollSCM('* * * * *') }

  environment {
    DATABASE_URL = 'postgresql://postgres:postgres@host.docker.internal:5432/france_essence?schema=public'
    GHCR_IMAGE = 'ghcr.io/leoslegrand/france-essence'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'apt-get update && apt-get install -y git docker.io'
        sh 'npm install'
      }
    }

    stage('Test') {
      steps {
        sh 'npx prisma migrate deploy'
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Dockerize') {
      steps {
        script {
          def gitSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          env.IMAGE_TAG = "${env.GHCR_IMAGE}:${gitSha}"
          sh "docker build -t ${env.IMAGE_TAG} ."
        }
      }
    }

    stage('Push to GHCR') {
      steps {
        withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
          sh 'echo "$GH_TOKEN" | docker login ghcr.io -u leoslegrand --password-stdin'
          sh 'docker push "$IMAGE_TAG"'
        }
      }
    }

    stage('Tag on GitHub') {
      steps {
        withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
          script {
            def gitSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
            def tagName = "ci-${gitSha}"
            sh "git tag -a ${tagName} -m \"CI build ${gitSha}\""
            sh "git remote set-url origin https://x-access-token:${GH_TOKEN}@github.com/LeoSLegrand/france-essence.git"
            sh "git push origin ${tagName}"
          }
        }
      }
    }
  }
}
