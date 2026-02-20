#!/bin/bash

# Setup script for running MedGemma locally with Ollama
# This is the easiest way to run MedGemma on your local machine

set -e

echo "=== MedGemma Local Setup with Ollama ==="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install ollama
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo "Please install Ollama manually from https://ollama.com"
        exit 1
    fi
fi

echo "✓ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Starting Ollama service..."
    ollama serve &
    sleep 3
fi

echo "✓ Ollama service is running"

# Pull MedGemma model
echo ""
echo "Pulling MedGemma model (this may take a few minutes)..."
ollama pull medgemma

echo ""
echo "✓ MedGemma model is ready!"
echo ""

# Test the model
echo "=== Testing MedGemma ==="
echo "Query: What are common symptoms of iron deficiency?"
echo ""
ollama run medgemma "What are common symptoms of iron deficiency?" --verbose

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To use MedGemma locally with the backend, update your .env file:"
echo ""
echo "  LLM_PROVIDER=local"
echo "  LOCAL_LLM_URL=http://localhost:11434"
echo "  LOCAL_LLM_MODEL=medgemma"
echo ""
echo "Then restart the backend server."
