import os

files_to_check = [
    'tailwind.config.js',
    'src/index.css',
    'src/main.tsx',
    'src/App.tsx',
    'server.ts',
    'vite.config.ts',
    'index.html'
]

# Target the phone's Download folder directly
download_dir = os.path.expanduser('~/storage/shared/Download')
if not os.path.exists(download_dir):
    download_dir = '/data/data/com.termux/files/home/storage/shared/Download'
    if not os.path.exists(download_dir):
        download_dir = '.' # Fallback to current dir if storage permission isn't set up

output_path = os.path.join(download_dir, 'a1')

with open(output_path, 'w') as outfile:
    for fname in files_to_check:
        outfile.write(f"=== FILE: {fname} ===\n")
        if os.path.exists(fname):
            with open(fname, 'r') as infile:
                outfile.write(infile.read())
        else:
            outfile.write("[FILE NOT FOUND]\n")
        outfile.write("\n\n" + "="*40 + "\n\n")

print(f"Successfully generated file 'a1' at: {output_path}")
