import json
import os

json_path = '/sdcard/Download/skillswapapp-905ca-firebase-adminsdk-fbsvc-5914b63297.json'
env_path = os.path.expanduser('~/skillswap/.env')

try:
    print(f"Reading JSON file from: {json_path}")
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    project_id = data.get('project_id')
    client_email = data.get('client_email')
    private_key = data.get('private_key')

    if not private_key:
        print("Error: Could not find 'private_key' in the JSON file.")
        exit(1)

    updated_keys = {
        'FIREBASE_PROJECT_ID': project_id,
        'FIREBASE_CLIENT_EMAIL': client_email,
        'FIREBASE_PRIVATE_KEY': f'"{private_key}"'
    }

    env_lines = []
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_lines = f.readlines()

    new_env_lines = []
    found_keys = set()

    for line in env_lines:
        stripped = line.strip()
        if '=' in stripped and not stripped.startswith('#'):
            key = stripped.split('=')[0].strip()
            if key in updated_keys:
                new_env_lines.append(f"{key}={updated_keys[key]}\n")
                found_keys.add(key)
                continue
        new_env_lines.append(line)

    for key, val in updated_keys.items():
        if key not in found_keys and val:
            new_env_lines.append(f"{key}={val}\n")

    with open(env_path, 'w') as f:
        f.writelines(new_env_lines)

    print("Success! .env has been updated with your new Firebase credentials.")

except Exception as e:
    print(f"An error occurred: {e}")
