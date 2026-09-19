import os
import requests

# Use your active OpenRouter API Key from your .env configuration
OPENROUTER_API_KEY = "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"

# Target local App folder in internal storage
output_dir = os.path.expanduser("~/storage/downloads/App")
os.makedirs(output_dir, exist_ok=True)
report_path = os.path.join(output_dir, "skillswap_master_audit.txt")

# Gather local project structure context from Termux
code_summary = ""
for root, dirs, files in os.walk("./src"):
    for file in files:
        if file.endswith((".js", ".jsx", ".ts", ".tsx", ".css")):
            code_summary += f"\n--- File: {file} ---\n"
            try:
                with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                    code_summary += f.read()[:1000]
            except Exception as e:
                code_summary += f"[Could not read file: {e}]"

prompt = f"""
Perform a deep-dive diagnostic audit on the SkillSwapApp codebase context provided below.
Check:
1. Firebase integration & security rules.
2. Escrow state machine logic.
3. Payment gateways (Stripe, PayPal, M-Pesa Daraja API).
4. CSS layout responsiveness.

Codebase Context:
{code_summary}

Provide specific code snippets and implementation fixes to ensure a perfect international flow.
"""

print("[*] Querying Gemini and DeepSeek R1 via OpenRouter (Max Tokens: 4000)...")

headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://skillswapapp.local",
    "X-Title": "SkillSwapApp Audit"
}

# 1. Query Gemini via OpenRouter
gemini_response = "Gemini Audit Error"
try:
    payload_gemini = {
        "model": "google/gemini-2.5-flash", # or google/gemini-flash-1.5
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000
    }
    res = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload_gemini, headers=headers)
    if res.status_code == 200:
        gemini_response = res.json()["choices"][0]["message"]["content"]
    else:
        gemini_response = f"OpenRouter Gemini Error: {res.text}"
except Exception as e:
    gemini_response = f"Gemini Exception: {e}"

# 2. Query DeepSeek R1 via OpenRouter with max_tokens set to 4000
deepseek_response = "DeepSeek Audit Error"
try:
    payload_deepseek = {
        "model": "deepseek/deepseek-r1",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000
    }
    res = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload_deepseek, headers=headers)
    if res.status_code == 200:
        deepseek_response = res.json()["choices"][0]["message"]["content"]
    else:
        deepseek_response = f"OpenRouter DeepSeek Error: {res.text}"
except Exception as e:
    deepseek_response = f"DeepSeek Exception: {e}"

# Compile Master Report into Download/App Folder
final_report = f"""==================================================
SKILLSWAP APP - MASTER AI DIAGNOSTIC REPORT
Target Environments: Gemini & DeepSeek R1 via OpenRouter (4k Tokens)
==================================================

=== SECTION A: GEMINI AUDIT & FIXES ===
{gemini_response}

=== SECTION B: DEEPSEEK R1 REASONING & FIXES ===
{deepseek_response}
==================================================
"""

with open(report_path, "w", encoding="utf-8") as f:
    f.write(final_report)

print(f"[+] Success! Master audit successfully written directly to: {report_path}")
