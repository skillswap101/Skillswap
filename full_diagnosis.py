import os, requests, json

print("⏳ Querying Gemini...")
gem = requests.post(
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={os.environ.get('GEMINI_API_KEY','')}",
    json={"contents": [{"parts": [{"text": "Review full-stack mobile web app skillswap5.0 (React, Vite, Express, Firebase v14, M-Pesa). Identify auth security risks in Express, atomic escrow transaction flaws in Firestore, and Vite/esbuild build mismatches. Provide code fixes."}]}]}
).json()

print("⏳ Querying DeepSeek R1...")
ds = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY','')}"},
    json={
        "model": "deepseek/deepseek-r1", 
        "messages": [{"role": "user", "content": "Analyze skillswap5.0 architecture: React frontend, Node/Express backend, Firebase Admin v14, M-Pesa webhooks. Give specific vulnerability points and code hardening steps."}], 
        "max_tokens": 3000
    }
).json()

with open("project_diagnosis_report.md", "w") as f:
    f.write(f"# SkillSwap 5.0 Targeted Diagnosis Report\n\n## Gemini Analysis\n```json\n{json.dumps(gem, indent=2)}\n```\n\n## DeepSeek Analysis\n```json\n{json.dumps(ds, indent=2)}\n```")

print("\n[✅] Updated report saved to project_diagnosis_report.md")
