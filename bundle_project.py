import os
import sys

def bundle_project():
    project_dir = "skillswap5.0"
    
    home_dir = os.environ.get("HOME", "/data/data/com.termux/files/home")
    output_dir = os.path.join(home_dir, "storage", "shared", "Download")
    output_file = os.path.join(output_dir, "skillswap5_bundle.txt")
    
    if not os.path.isdir(project_dir):
        print(f"Error: Directory '{project_dir}' not found in the current path.")
        return

    os.makedirs(output_dir, exist_ok=True)
    
    excluded_dirs = {'node_modules', '.git', 'dist', 'build', '.expo'}
    excluded_extensions = {'.lock', '.png', '.jpg', '.jpeg', '.ico', '.svg', '.mp4', '.zip'}
    
    print(f"Starting bundle of {project_dir}...")
    
    count = 0
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in excluded_dirs]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in excluded_extensions:
                    continue
                    
                file_path = os.path.join(root, file)
                
                if os.path.abspath(file_path) == os.path.abspath(output_file):
                    continue
                    
                try:
                    outfile.write("----------------------------------------------------\n")
                    outfile.write(f"FILE: {file_path}\n")
                    outfile.write("----------------------------------------------------\n")
                    
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        outfile.write(infile.read())
                        
                    outfile.write("\n\n\n")
                    count += 1
                except Exception as e:
                    print(f"Skipping {file_path} due to error: {e}")
                    
    print(f"Success! Bundled {count} files into: {output_file}")

if __name__ == "__main__":
    bundle_project()
