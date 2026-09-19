import os
import json
import urllib.request
import urllib.error

env_path = os.path.join(os.getcwd(), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

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
                    context['files'][filename] = "".join([f.readline() for _ in range(35)])
            except Exception:
                pass
    return context

def query_openrouter(prompt):
    print("\n[⏳] Querying DeepSeek R1 via OpenRouter...")
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "deepseek/deepseek-r1",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1500
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
        with urllib.request.urlopen(req, timeout=90) as response:
            res = json.loads(response.read().decode())
            message = res['choices'][0]['message']
            # DeepSeek R1 can put content in 'content' or 'reasoning'
            content = message.get('content') or message.get('reasoning')
            return content if content else f"Raw response structure: {res}"
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        return f"OpenRouter HTTP Error {e.code}: {e.reason}\nDetails: {error_body}"
    except Exception as e:
        return f"OpenRouter Error: {e}"

def main():
    print("🚀 Running robust DeepSeek diagnosis...")
    context = gather_context()
    prompt = (
        "You are an expert full-stack developer and code architect. "
        "Review this skillswap5.0 project layout: " + json.dumps(context) + ". "
        "Provide: 1. Project flow and architecture diagnosis. 2. UX friction points. 3. Ready-to-use production code snippets."
    )
    
    deepseek_res = query_openrouter(prompt)
    
    report = f"# SkillSwap5.0 Optimized Diagnosis Report\n\n## 🧠 DeepSeek R1 Analysis\n{deepseek_res}"
    with open("project_diagnosis_report.md", "w", encoding="utf-8") as f:
        f.write(report)
    print("\n[✅] Success! Report saved to project_diagnosis_report.md")

if __name__ == '__main__':
    main()
