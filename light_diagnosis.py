import os
import json
import urllib.request
import urllib.error
import time

# Automatically load .env file
env_path = os.path.join(os.getcwd(), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
PROJECT_DIR = os.getcwd()

def gather_context():
    context = {}
    try:
        context['directory_contents'] = os.listdir(PROJECT_DIR)
    except Exception as e:
        context['directory_contents'] = str(e)
    
    context['files'] = {}
    for filename in ['package.json', 'README.md', 'server.js']:
        filepath = os.path.join(PROJECT_DIR, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    context['files'][filename] = "".join([f.readline() for _ in range(30)])
            except Exception:
                pass
    return context

def query_gemini(prompt):
    print("\n[⏳] Querying Gemini (v1beta/models/gemini-2.0-flash)...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res = json.loads(response.read().decode())
            return res['candidates'][0]['content']['parts'][0]['text']
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        return f"Gemini HTTP Error {e.code}: {e.reason}\nDetails: {error_body}"
    except Exception as e:
        return f"Gemini Error: {e}"

def query_openrouter(prompt):
    print("\n[⏳] Querying DeepSeek R1 via OpenRouter...")
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "deepseek/deepseek-r1",
        "messages": [{"role": "user", "content": prompt}]
    }
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://termux-local-dev',
            'X-Title': 'SkillSwap5.0'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            res = json.loads(response.read().decode())
            return res['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        return f"OpenRouter HTTP Error {e.code}: {e.reason}\nDetails: {error_body}"
    except Exception as e:
        return f"OpenRouter Error: {e}"

def main():
    print("🚀 Running robust project diagnosis...")
    context = gather_context()
    prompt = (
        "You are an expert full-stack engineer and UI/UX strategist. "
        "Analyze this skillswap5.0 project layout: " + json.dumps(context) + ". "
        "Provide a concrete flow diagnosis, user experience friction warnings, and ready-to-use implementation code snippets."
    )
    
    gemini_res = query_gemini(prompt)
    time.sleep(2) # Prevent rapid-fire rate limits
    deepseek_res = query_openrouter(prompt)
    
    report = f"# SkillSwap5.0 Diagnosis Report\n\n## Gemini Analysis\n{gemini_res}\n\n## DeepSeek R1 Analysis\n{deepseek_res}"
    with open("project_diagnosis_report.md", "w", encoding="utf-8") as f:
        f.write(report)
    print("\n[✅] Diagnosis complete! Saved to project_diagnosis_report.md")

if __name__ == '__main__':
    main()
