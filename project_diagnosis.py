import os
import json
import requests
from google import genai

# --- CONFIGURATION & API KEYS ---
# The script checks your environment variables or you can paste keys directly here.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY")

PROJECT_DIR = os.getcwd()

def gather_project_context():
    """Gathers critical file contents and structure of skillswap5.0 safely."""
    context = {}
    files_to_check = ['package.json', 'README.md', 'server.js', 'App.js', 'firebase.json']
    
    # List directory files
    try:
        context['directory_contents'] = os.listdir(PROJECT_DIR)
    except Exception as e:
        context['directory_contents'] = str(e)
        
    # Read core files if they exist
    context['files'] = {}
    for filename in files_to_check:
        filepath = os.path.join(PROJECT_DIR, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    # Limit file read to first 50 lines to avoid token overload
                    content = "".join([f.readline() for _ in range(50)])
                    context['files'][filename] = content
            except Exception as e:
                context['files'][filename] = f"Error reading file: {e}"
                
    return context

def build_prompt(context):
    return f"""
You are an expert full-stack code reviewer, system architect, and UX specialist. 
Please perform a rigorous diagnosis, coherence check, and architectural review of my peer-to-peer skill-sharing web application project named 'skillswap5.0'.

Here is the current project layout and configuration extracted from local workspace:
- Working Directory Contents: {context.get('directory_contents')}
- Key File Snippets: {json.dumps(context.get('files'), indent=2)}

Please provide:
1. **Project Flow & Coherence Diagnosis**: Evaluate how well the architecture hangs together (e.g., frontend-backend connection, state management, authentication, and Firebase/payment flows).
2. **Realistic User Experience Improvements**: Identify friction points that would stop real users from liking or using the app regularly.
3. **Actionable Recommendations & Code Implementations**: Provide production-ready, robust code snippets or configuration files fixing structural gaps or adding polish to make the application superb.
"""

def query_gemini(prompt):
    print("\n[⏳] Querying Gemini 3.6 (via Google GenAI SDK)...")
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Gemini API Error: {e}"

def query_deepseek(prompt):
    print("\n[⏳] Querying DeepSeek R1 (via OpenRouter)...")
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://termux-local-dev", 
            "X-Title": "SkillSwap5.0 Diagnosis"
        }
        payload = {
            "model": "deepseek/deepseek-r1",
            "messages": [
                {"role": "system", "content": "You are an expert full-stack developer and code architect."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.6
        }
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=60)
        res_json = response.json()
        if "choices" in res_json:
            return res_json["choices"][0]["message"]["content"]
        else:
            return f"OpenRouter Response Error: {res_json}"
    except Exception as e:
        return f"DeepSeek/OpenRouter API Error: {e}"

def main():
    print("==================================================")
    print("🚀 Starting skillswap5.0 Multi-Model AI Diagnosis")
    print("==================================================")
    
    context = gather_project_context()
    prompt = build_prompt(context)
    
    # Fetch responses from both AI engines
    gemini_output = query_gemini(prompt)
    deepseek_output = query_deepseek(prompt)
    
    # Save the consolidated output to a report file in the project folder
    report_filename = "project_diagnosis_report.md"
    report_content = f"""# SkillSwap5.0 Multi-Model Project Diagnosis Report

## 🤖 Gemini Analysis & Recommendations
{gemini_output}

---

## 🧠 DeepSeek R1 Analysis & Recommendations
{deepseek_output}
"""
    
    with open(report_filename, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"\n[✅] Diagnosis complete! Combined report successfully saved to: {os.path.join(PROJECT_DIR, report_filename)}")

if __name__ == "__main__":
    main()
