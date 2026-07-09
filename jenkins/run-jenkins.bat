@echo off
title Running Jenkins CI/CD Server
echo Starting Jenkins on http://localhost:8082 ...
echo Press Ctrl+C in this window to stop the server.
echo.
"%~dp0jre21\bin\java.exe" -jar "%~dp0jenkins.war" --httpPort=8082
pause
