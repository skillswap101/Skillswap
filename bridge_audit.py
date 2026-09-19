#!/usr/bin/env python3
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parent
src = "\n".join(p.read_text(encoding="utf-8", errors="ignore")
                for p in (ROOT/"src").rglob("*.ts*"))
server = (ROOT/"server.ts").read_text(encoding="utf-8", errors="ignore")

print("="*70)
print("SkillSwap 5.0 — bridge audit")
print("="*70)
routes = [
    "/api/ai/assistant",
    "/api/ai/generate-proposal",
    "/api/ai/learning-roadmap",
    "/api/ai/match",
    "/api/deepseek-reasoning",
    "/api/escrow/transfer",
]
for route in routes:
    print(f"{'OK' if route in src and route in server else 'FAIL':6} {route}")

for name in ["users","skills","proposals","sessions","messages","reviews"]:
    print(f"{'INFO':6} {name:12} references={len(re.findall(r'["\\']'+name+r'["\\']', src))}")

print()
print("mockData:", (ROOT/"src/data/mockData.ts").exists())
print("repository:", (ROOT/"src/utils/firestoreRepository.ts").exists())
print("rules:", (ROOT/"firestore.rules").exists())
print()
print("NOTE: mockData is still a seed. Full hydration/mutation wiring in App.tsx")
print("must be done against the exact current App state transitions; this pass")
print("does not falsely claim that localStorage has become Firestore.")
