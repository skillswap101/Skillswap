import os
import shutil

current_dir = os.getcwd()
project_name = os.path.basename(current_dir)

download_dir = '/sdcard/Download'
if not os.path.exists(download_dir):
    download_dir = os.path.expanduser('~/storage/shared/Download')

os.makedirs(download_dir, exist_ok=True)
output_filename = os.path.join(download_dir, f"{project_name}_backup")

print(f"📦 Packaging '{project_name}' from: {current_dir}")
print(f"📁 Saving to Downloads: {output_filename}.zip")

try:
    archive_path = shutil.make_archive(output_filename, 'zip', current_dir)
    print(f"✅ Successfully created backup at: {archive_path}")
except Exception as e:
    print(f"❌ Error creating zip archive: {e}")
