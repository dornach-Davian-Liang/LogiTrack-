#!/bin/bash

echo "================================"
echo "LogiTrack Backend - Starting..."
echo "================================"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null
then
    echo "Error: Maven is not installed!"
    echo "Please install Maven first:"
    echo "  Ubuntu/Debian: sudo apt-get install maven"
    echo "  MacOS: brew install maven"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null
then
    echo "Error: Java is not installed!"
    echo "Please install Java 17 or higher"
    exit 1
fi

# Print Java version
echo "Java Version:"
java -version
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

echo "Building the project..."
mvn clean install -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "Starting Spring Boot application..."
    echo "Backend will be available at: http://localhost:8080"
    echo "H2 Console available at: http://localhost:8080/h2-console"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    mvn spring-boot:run
else
    echo ""
    echo "✗ Build failed!"
    exit 1
fi
