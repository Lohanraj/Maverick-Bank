pipeline {
    agent any

    environment {
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        NODE_ENV = 'production'
    }

    stages {
        stage('Restore & Build Backend') {
            steps {
                dir('Backend') {
                    echo 'Restoring NuGet packages...'
                    // Run bat on Windows agents, sh on Linux agents
                    script {
                        if (isUnix()) {
                            sh 'dotnet restore'
                            sh 'dotnet build --no-restore --configuration Release'
                        } else {
                            bat 'dotnet restore'
                            bat 'dotnet build --no-restore --configuration Release'
                        }
                    }
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('Backend') {
                    echo 'Running Backend Unit Tests...'
                    script {
                        if (isUnix()) {
                            sh 'dotnet test --no-build --configuration Release'
                        } else {
                            bat 'dotnet test --no-build --configuration Release'
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    echo 'Installing npm dependencies and building frontend...'
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                            sh 'npm run build'
                        } else {
                            bat 'npm install'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Validate Docker Images') {
            steps {
                echo 'Validating Dockerfile compilations...'
                script {
                    if (isUnix()) {
                        sh 'docker build -t maverick-bank-api:latest -f Backend/MaverickBank.API/Dockerfile Backend'
                        sh 'docker build -t maverick-bank-ui:latest -f Frontend/Dockerfile Frontend'
                    } else {
                        bat 'docker build -t maverick-bank-api:latest -f Backend/MaverickBank.API/Dockerfile Backend'
                        bat 'docker build -t maverick-bank-ui:latest -f Frontend/Dockerfile Frontend'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo 'Maverick Bank CI/CD Pipeline completed successfully! 🎉'
        }
        failure {
            echo 'Maverick Bank CI/CD Pipeline failed. Please check build logs. ❌'
        }
    }
}
