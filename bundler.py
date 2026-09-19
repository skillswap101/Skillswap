import os

# Define paths for the Download directory
TARGET_FOLDER = os.path.expanduser("~/skillswap5.0")
OUTPUT_FILE = "/sdcard/Download/swbundle.txt"

INCLUDE_EXTENSIONS = {
    ".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".py", ".md", ".txt",
}

SKIP_FOLDERS = {"node_modules", ".git", "dist", "build", ".expo", ".next", ".vscode"}

def bundle_files():
    print(f"Scanning project: {TARGET_FOLDER}")
    
    if not os.path.exists(TARGET_FOLDER):
        print(f"Error: The folder '{TARGET_FOLDER}' does not exist.")
        return

    file_count = 0
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        outfile.write(f"=== PROJECT BUNDLE: skillswap5.0 ===\n\n")
        
        for root, dirs, files in os.walk(TARGET_FOLDER):
            dirs[:] = [d for d in dirs if d not in SKIP_FOLDERS]
            
            for file in files:
                _, ext = os.path.splitext(file)
                
                if ext.lower() in INCLUDE_EXTENSIONS:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, TARGET_FOLDER)
                    
                    print(f"Adding: {relative_path}")
                    
                    outfile.write(f"\n{'='*50}\n")
                    outfile.write(f"FILE: {relative_path}\n")
                    outfile.write(f"{'='*50}\n\n")
                    
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as infile:
                            outfile.write(infile.read())
                        outfile.write("\n")
                        file_count += 1
                    except Exception as e:
                        outfile.write(f"[Error reading file: {e}]\n")

    print(f"\nSuccessfully bundled {file_count} files into:\n-> {OUTPUT_FILE}")

if __name__ == "__main__":
    bundle_files()
