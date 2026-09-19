import os

server_path = "server.ts"
if os.path.exists(server_path):
    with open(server_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace old or missing firebase initialization with the local json credential import
    old_init_block = """if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}"""

    new_init_block = """import serviceAccount from "./serviceaccountkey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}"""

    if "serviceaccountkey.json" not in content:
        if old_init_block in content:
            content = content.replace(old_init_block, new_init_block)
        else:
            # If standard init wasn't found, prepend it with the import at the top
            content = 'import serviceAccount from "./serviceaccountkey.json";\n' + content

        with open(server_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated server.ts to use serviceaccountkey.json successfully!")
    else:
        print("server.ts is already configured to use serviceaccountkey.json.")
