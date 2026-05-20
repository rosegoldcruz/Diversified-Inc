import requests
import re

targets = ["https://app.snrglabs.com/api/settings/system-health", "http://127.0.0.1:3000/api/settings/system-health"]
secret_patterns = [
    r"DATABASE_URL",
    r"AeonBoss2025!",
    r"sk-4b2d35",
    r"YHQdReuZ"
]

for url in targets:
    try:
        print(f"Testing {url}...")
        resp = requests.get(url, timeout=5)
        print(f"  Reachable: Yes")
        print(f"  Status Code: {resp.status_code}")
        print(f"  Content-Type: {resp.headers.get('Content-Type')}")
        
        try:
            body_json = resp.json()
            is_json = True
            body_text = resp.text
        except:
            is_json = False
            body_text = resp.text
            
        print(f"  Is JSON: {is_json}")
        
        secrets_found = []
        for pattern in secret_patterns:
            if re.search(pattern, body_text):
                secrets_found.append(pattern)
        
        if secrets_found:
            print(f"  SECRETS EXPOSED: Yes ({', '.join(secrets_found)})")
        else:
            print(f"  Secrets Exposed: No")
        print("-" * 20)
    except Exception as e:
        print(f"Testing {url}...")
        print(f"  Reachable: No ({e})")
        print("-" * 20)
