import os

server_path = "server.ts"

if not os.path.exists(server_path):
    print(f"Error: {server_path} not found in current directory.")
    exit(1)

with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

# Check if Firebase Admin and middleware are already present
has_firebase = "firebase-admin" in content
has_middleware = "verifyFirebaseToken" in content

print(f"--- Analysis of {server_path} ---")
print(f"Firebase Admin SDK imported: {has_firebase}")
print(f"verifyFirebaseToken middleware present: {has_middleware}")

if has_firebase and has_middleware:
    print("\nResult: Your server.ts already contains Firebase Admin and token verification. No replacement needed.")
else:
    print("\nResult: Your server.ts is missing Firebase integration or middleware. A merge/update is required.")
    
    # Optional: Automatically append or patch if requested, but safely alerting you first.
