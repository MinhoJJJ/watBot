
import requests
import sys

def verify_fix():
    print("Verifying /api/analyze endpoint...")
    try:
        # Request for Samsung Electronics (005930)
        # Timeout increased to 20s as AI analysis might take time
        response = requests.get("http://localhost:8989/api/analyze?symbol=005930", timeout=20)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response Data (Truncated):")
            print(str(data)[:500] + "...")
            
            # Check for error message inside
            opinions = data.get('opinions', [])
            for op in opinions:
                if "Quota exceeded" in op.get('reason', ''):
                    print(f"\n[WARN] API Quota Exceeded detected in response: {op['reason']}")
                elif "not found" in op.get('reason', ''):
                    print(f"\n[WARN] Model Not Found detected: {op['reason']}")
                    
            print("\nSUCCESS: Endpoint is reachable and returning valid JSON.")
        else:
            print(f"FAILURE: Status {response.status_code}")
            print(response.text[:1000])
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    verify_fix()
