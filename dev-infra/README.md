# Local LLM Setup for Medical AI Assistant

This directory contains scripts and configurations for running LLMs locally.

## Options for Running Local LLMs

### Option 1: Ollama with Gemma/Llama (Recommended - Easiest)

**Note:** MedGemma is not available in Ollama's public library. Use Gemma 2 or Llama 3.2 instead.

```bash
# Install Ollama (if not already installed)
brew install ollama

# Start Ollama service
ollama serve

# Pull a model (choose one):
ollama pull gemma2        # Google's Gemma 2 (similar architecture to MedGemma)
ollama pull llama3.2      # Meta's Llama 3.2 (good general purpose)
ollama pull mistral       # Mistral 7B

# Test it
ollama run gemma2 "What are the symptoms of vitamin D deficiency?"
```

**For MedGemma specifically**, use the GCP endpoint (already configured) or Hugging Face (see Option 2).

### Option 2: Hugging Face Transformers
Requires more setup but gives full control.

```bash
# Install dependencies
pip install transformers torch accelerate

# Run the setup script
python setup_medgemma_hf.py
```

### Option 3: vLLM (Best for Production)
High-performance inference server.

```bash
# Install vLLM
pip install vllm

# Run MedGemma with vLLM
python -m vllm.entrypoints.openai.api_server \
    --model google/medgemma-4b-it \
    --port 8080
```

## Hardware Requirements

| Model | VRAM Required | RAM Required |
|-------|---------------|--------------|
| MedGemma 4B | 8GB GPU | 16GB |
| MedGemma 4B (CPU) | N/A | 16GB+ |

## Backend Configuration

To use local MedGemma instead of GCP, update `.env`:

```env
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=medgemma
```
