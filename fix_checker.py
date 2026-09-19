with open('check_firebase.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Updates the detection condition to look for 'firebase-admin' as well
code = code.replace("if 'firebase' in content", "if 'firebase' in content or 'firebase-admin' in content")

with open('check_firebase.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Successfully patched check_firebase.py')
