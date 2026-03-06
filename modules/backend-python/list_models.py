
import requests
import json

API_KEY = "AIzaSyCgEjS5BC-pVOeMsHnXxOMgx_oBP2Jn0Vw"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    response = requests.get(url, timeout=10)
    data = response.json()
    if 'models' in data:
        print("Available Models:")
        for m in data['models']:
            if 'generateContent' in m['supportedGenerationMethods']:
                print(f"- {m['name']}")
    else:
        print("No models found or error:", data)
except Exception as e:
    print(f"Error: {e}")
