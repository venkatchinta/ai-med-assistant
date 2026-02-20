#!/usr/bin/env python3
"""
Setup script for running MedGemma locally using Hugging Face Transformers.

Requirements:
- Python 3.10+
- 16GB+ RAM (or 8GB+ VRAM for GPU)
- Hugging Face account with access to MedGemma

Note: MedGemma requires accepting the license on Hugging Face:
https://huggingface.co/google/medgemma-4b-it
"""

import subprocess
import sys


def install_dependencies():
    """Install required packages."""
    packages = [
        "torch",
        "transformers",
        "accelerate",
        "huggingface_hub",
    ]
    
    print("Installing dependencies...")
    for pkg in packages:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
    print("✓ Dependencies installed")


def login_huggingface():
    """Login to Hugging Face."""
    from huggingface_hub import login
    
    print("\nYou need to login to Hugging Face to access MedGemma.")
    print("Get your token from: https://huggingface.co/settings/tokens")
    print("")
    login()


def download_model():
    """Download MedGemma model."""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    
    model_name = "google/medgemma-4b-it"
    
    print(f"\nDownloading {model_name}...")
    print("This may take several minutes depending on your connection.")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        device_map="auto",
        torch_dtype="auto",
    )
    
    print("✓ Model downloaded successfully!")
    return model, tokenizer


def test_model(model, tokenizer):
    """Test the model with a sample query."""
    print("\n=== Testing MedGemma ===")
    
    prompt = "What are the common symptoms of vitamin D deficiency?"
    
    messages = [
        {"role": "system", "content": "You are an expert medical AI assistant."},
        {"role": "user", "content": prompt}
    ]
    
    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True
    ).to(model.device)
    
    print(f"Query: {prompt}")
    print("\nGenerating response...")
    
    outputs = model.generate(
        inputs,
        max_new_tokens=256,
        do_sample=True,
        temperature=0.7,
    )
    
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    
    print(f"\nResponse:\n{response}")
    print("\n✓ Model is working correctly!")


def main():
    print("=" * 60)
    print("MedGemma Local Setup (Hugging Face)")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 10):
        print("ERROR: Python 3.10+ is required")
        sys.exit(1)
    
    # Install dependencies
    install_dependencies()
    
    # Login to Hugging Face
    login_huggingface()
    
    # Download model
    model, tokenizer = download_model()
    
    # Test model
    test_model(model, tokenizer)
    
    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("\nTo use MedGemma with the backend, you can:")
    print("1. Run the local inference server: python run_medgemma_server.py")
    print("2. Update .env: LLM_PROVIDER=local, LOCAL_LLM_URL=http://localhost:8080")


if __name__ == "__main__":
    main()
