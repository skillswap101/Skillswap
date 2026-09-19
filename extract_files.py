import os

target_files = [
    "server.ts",
    "App.tsx",
    "TimeCreditsView.tsx",
    "AIAssistantDrawer.tsx"
]

# Target path directly in Android's shared Download folder
download_dir = "/sdcard/Download"
os.makedirs(download_dir, exist_ok=True)
output_filename = os.path.join(download_dir, "four_files_bundle.txt")

print(f"Searching and bundling target files to {output_filename}...")

with open(output_filename, "w", encoding="utf-8") as outfile:
    for filename in target_files:
        found = False
        for root, dirs, files in os.walk("."):
            if filename in files:
                filepath = os.path.join(root, filename)
                found = True
                print(f"Adding: {filepath}")
                
                outfile.write(f"\n\n--- FILE START: {filepath} ---\n\n")
                try:
                    with open(filepath, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"[Error reading file: {e}]")
                outfile.write(f"\n\n--- FILE END: {filepath} ---\n\n")
                break
        if not found:
            print(f"Warning: Could not find {filename} in the current directory tree.")

print(f"\nDone! Bundle successfully saved to: {output_filename}")
