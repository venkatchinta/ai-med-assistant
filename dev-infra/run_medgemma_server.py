#!/usr/bin/env python3
"""
Local MedGemma inference server with Ollama-compatible API.

This server provides an API compatible with Ollama, so the backend
can use it without modification by setting:
    LOCAL_LLM_URL=http://localhost:8080
    LOCAL_LLM_MODEL=medgemma

Requirements:
    pip install transformers torch accelerate flask
"""

import json
from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = Flask(__name__)

# Global model and tokenizer
model = None
tokenizer = None


def load_model():
    """Load MedGemma model."""
    global model, tokenizer
    
    model_name = "google/medgemma-4b-it"
    print(f"Loading {model_name}...")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        device_map="auto",
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    )
    
    print("✓ Model loaded!")


@app.route("/api/generate", methods=["POST"])
def generate():
    """Ollama-compatible generate endpoint."""
    data = request.json
    prompt = data.get("prompt", "")
    max_tokens = data.get("options", {}).get("num_predict", 512)
    temperature = data.get("options", {}).get("temperature", 0.7)
    
    # Format as chat
    messages = [
        {"role": "system", "content": "You are an expert medical AI assistant."},
        {"role": "user", "content": prompt}
    ]
    
    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True
    ).to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=temperature,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    
    return jsonify({
        "model": "medgemma",
        "response": response,
        "done": True
    })


@app.route("/api/tags", methods=["GET"])
def tags():
    """List available models (Ollama-compatible)."""
    return jsonify({
        "models": [
            {
                "name": "medgemma",
                "model": "google/medgemma-4b-it",
                "size": 4000000000,
            }
        ]
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    """Ollama-compatible chat endpoint."""
    data = request.json
    messages = data.get("messages", [])
    max_tokens = data.get("options", {}).get("num_predict", 512)
    temperature = data.get("options", {}).get("temperature", 0.7)
    
    # Convert to HF format
    hf_messages = []
    for msg in messages:
        hf_messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    inputs = tokenizer.apply_chat_template(
        hf_messages,
        return_tensors="pt",
        add_generation_prompt=True
    ).to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=temperature,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    
    return jsonify({
        "model": "medgemma",
        "message": {
            "role": "assistant",
            "content": response
        },
        "done": True
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": "medgemma"})


if __name__ == "__main__":
    load_model()
    print("\n=== MedGemma Server Running ===")
    print("URL: http://localhost:8080")
    print("Compatible with Ollama API")
    print("\nTo use with backend, set in .env:")
    print("  LLM_PROVIDER=local")
    print("  LOCAL_LLM_URL=http://localhost:8080")
    print("  LOCAL_LLM_MODEL=medgemma")
    app.run(host="0.0.0.0", port=8080)
