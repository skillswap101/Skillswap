import os

TARGETS = {
    "server.ts": {
        "import_snippet": "import admin from 'firebase-admin';\n",
        "target_line": "import"
    },
    "src/App.tsx": {
        "import_snippet": "import { db, auth } from './firebase';\nimport { collection, onSnapshot } from 'firebase/firestore';\n",
        "target_line": "import React"
    },
    "src/components/TimeCreditsView.tsx": {
        "import_snippet": "import { db, auth } from '../firebase';\nimport { doc, onSnapshot } from 'firebase/firestore';\n",
        "target_line": "import React"
    },
    "src/components/AIAssistantDrawer.tsx": {
        "import_snippet": "import { db, auth } from '../firebase';\nimport { collection, addDoc, serverTimestamp } from 'firebase/firestore';\n",
        "target_line": "import React"
    }
}

def inject_imports():
    base_dir = os.getcwd()
    for filepath, config in TARGETS.items():
        full_path = os.path.join(base_dir, filepath)
        if not os.path.exists(full_path):
            continue
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "firebase" in content.lower():
            continue
        lines = content.splitlines(keepends=True)
        inserted = False
        new_lines = []
        for line in lines:
            if not inserted and config["target_line"] in line:
                new_lines.append(config["import_snippet"] + line)
                inserted = True
            else:
                new_lines.append(line)
        if not inserted:
            new_lines.insert(0, config["import_snippet"])
        with open(full_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"Injected: {filepath}")

if __name__ == "__main__":
    inject_imports()
