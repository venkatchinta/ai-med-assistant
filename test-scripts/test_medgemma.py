#!/usr/bin/env python3
"""
Test script for validating GCP MedGemma model access.

Prerequisites:
    1. Google Cloud SDK installed
    2. Run: gcloud auth application-default login
    3. Install: pip install google-auth requests
"""

import json
import subprocess
import sys

try:
    import google.auth
    import google.auth.transport.requests
    import requests
except ImportError:
    print("ERROR: Required packages not installed.")
    print("Run: pip install google-auth requests")
    sys.exit(1)


# Configuration
ENDPOINT_ID = "mg-endpoint-1f3addd2-8e87-4fcd-a6e2-019ff94fce3e"
PROJECT_ID = "977337325460"
LOCATION = "us-central1"
DEDICATED_HOST = f"{ENDPOINT_ID}.{LOCATION}-{PROJECT_ID}.prediction.vertexai.goog"


def get_access_token():
    """Get access token using Application Default Credentials."""
    credentials, project = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token


def test_dns_resolution():
    """Test if the dedicated endpoint DNS resolves."""
    import socket
    try:
        socket.gethostbyname(DEDICATED_HOST)
        return True
    except socket.gaierror:
        return False


def test_medgemma_text_query():
    """Test MedGemma with a simple text query."""
    print("\n=== Test 1: Simple Text Query ===")
    
    url = f"https://{DEDICATED_HOST}/v1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/{ENDPOINT_ID}:predict"
    
    payload = {
        "instances": [
            {
                "@requestFormat": "chatCompletions",
                "messages": [
                    {
                        "role": "system",
                        "content": [{"type": "text", "text": "You are an expert medical AI assistant."}]
                    },
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": "What are the common symptoms of vitamin D deficiency?"}]
                    }
                ],
                "max_tokens": 200
            }
        ]
    }
    
    try:
        token = get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"URL: {url}")
        print(f"Sending request...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ SUCCESS! MedGemma endpoint is accessible.")
            print("\nResponse:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"✗ FAILED with HTTP {response.status_code}")
            print("\nResponse:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
            
    except requests.exceptions.ConnectionError as e:
        print(f"✗ FAILED: Connection error - {e}")
        print("  The dedicated endpoint may require VPC/Private Service Connect access.")
        return False
    except Exception as e:
        print(f"✗ FAILED: {e}")
        return False


def test_medgemma_with_image():
    """Test MedGemma with an image (X-ray analysis simulation)."""
    print("\n=== Test 2: Image Analysis Query ===")
    
    url = f"https://{DEDICATED_HOST}/v1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/{ENDPOINT_ID}:predict"
    
    # Note: For actual image testing, you would base64 encode an image
    # This is a text-only simulation
    payload = {
        "instances": [
            {
                "@requestFormat": "chatCompletions",
                "messages": [
                    {
                        "role": "system",
                        "content": [{"type": "text", "text": "You are an expert radiologist."}]
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe what you would look for in a chest X-ray to identify pneumonia."}
                        ]
                    }
                ],
                "max_tokens": 300
            }
        ]
    }
    
    try:
        token = get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"Sending radiology query...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ SUCCESS!")
            print("\nResponse:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"✗ FAILED with HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ FAILED: {e}")
        return False


def main():
    print("=" * 60)
    print("MedGemma Endpoint Test Script")
    print("=" * 60)
    print(f"\nEndpoint ID: {ENDPOINT_ID}")
    print(f"Project ID: {PROJECT_ID}")
    print(f"Dedicated Host: {DEDICATED_HOST}")
    
    # Check DNS resolution
    print("\n--- Checking DNS Resolution ---")
    if test_dns_resolution():
        print(f"✓ DNS resolution OK for {DEDICATED_HOST}")
    else:
        print(f"⚠ WARNING: DNS resolution FAILED for {DEDICATED_HOST}")
        print("  This endpoint requires VPC/Private Service Connect access.")
        print("  Cannot proceed with API tests from public network.")
        print("\n  Options:")
        print("  1. Run this script from within the GCP VPC network")
        print("  2. Set up Private Service Connect")
        print("  3. Redeploy MedGemma to a non-dedicated (public) endpoint")
        return
    
    # Run tests
    results = []
    
    results.append(("Text Query", test_medgemma_text_query()))
    results.append(("Image Analysis", test_medgemma_with_image()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"  {name}: {status}")
    
    passed_count = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed_count}/{len(results)} tests passed")


if __name__ == "__main__":
    main()
