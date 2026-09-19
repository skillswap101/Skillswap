import os, requests, json
url = "https://openrouter.ai/api/v1/chat/completions"
headers = {"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY', '')}", "Content-Type": "application/json"}
payload = {"model": "deepseek/deepseek-r1", "messages": [{"role": "user", "content": "Analyze full-stack app architecture."}], "max_tokens": 3000}
res = requests.post(url, headers=headers, json=payload).json()
with open("deepseek_diagnosis_report.md", "w") as f:
    f.write("# DeepSeek Diagnosis Report\n```json\n" + json.dumps(res, indent=2) + "\n```")
print("Done! Saved to deepseek_diagnosis_report.md")
