import os
import re

def analyze_project(root_dir='.'):
    extensions = ('.js', '.jsx', '.ts', '.tsx')
    ignored_dirs = {'node_modules', '.git', 'build', 'dist', '.expo', '.next', '.vscode'}
    
    firebase_keywords = [
        'db', 'auth', 'firestore', 'collection', 'doc', 
        'getFirestore', 'getAuth', 'initializeApp', 'addDoc', 
        'getDocs', 'setDoc', 'updateDoc', 'deleteDoc', 'onSnapshot',
        'signInWithEmailAndPassword', 'createUserWithEmailAndPassword', 
        'signOut', 'firebaseConfig', 'storage', 'analytics', 'query', 'where', 'getDoc', 'addDoc'
    ]
    
    import_pattern = re.compile(
        r'import\s+.*?from\s+[\'"]firebase[\'"]|'
        r'import\s+.*?from\s+[\'"]firebase/|'
        r'require\([\'"]firebase|'
        r'from\s+[\'"]\..*firebase|'
        r'from\s+[\'"]\.\./.*firebase'
    )
    
    supposed_to_import = []
    are_importing = []
    not_supposed_to_import = []
    
    target_abs = os.path.abspath(root_dir)
    if not os.path.exists(target_abs):
        print(f"Directory '{root_dir}' not found.")
        return supposed_to_import, are_importing, not_supposed_to_import
        
    for dirpath, dirnames, filenames in os.walk(target_abs):
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
            
        for filename in filenames:
            if filename.endswith(extensions):
                abs_file_path = os.path.join(dirpath, filename)
                
                # Compute relative path from the parent of target_abs to match your format skillswap5.0/...
                rel_path = os.path.relpath(abs_file_path, os.path.dirname(target_abs))
                
                try:
                    with open(abs_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    has_import = bool(import_pattern.search(content))
                    mentions_keywords = any(re.search(rf'\b{kw}\b', content) for kw in firebase_keywords)
                    
                    if has_import:
                        are_importing.append(rel_path)
                    elif mentions_keywords:
                        supposed_to_import.append(rel_path)
                    else:
                        not_supposed_to_import.append(rel_path)
                except Exception as e:
                    print(f"Error reading {abs_file_path}: {e}")
                    
    return supposed_to_import, are_importing, not_supposed_to_import

if __name__ == "__main__":
    target_dir = '.' if os.path.basename(os.path.abspath('.')) == 'skillswap5.0' else 'skillswap5.0'
    print(f"Scanning target: {os.path.abspath(target_dir)}\n")
    
    supposed, importing, not_supposed = analyze_project(target_dir)
    
    print("="*75)
    print(f"1. FILES SUPPOSED TO IMPORT FIREBASE ({len(supposed)})")
    print("="*75)
    for p in supposed:
        print(f"  {p}")
        
    print("\n" + "="*75)
    print(f"2. FILES CURRENTLY IMPORTING FIREBASE ({len(importing)})")
    print("="*75)
    for p in importing:
        print(f"  {p}")
        
    print("\n" + "="*75)
    print(f"3. FILES NOT SUPPOSED TO IMPORT FIREBASE ({len(not_supposed)})")
    print("="*75)
    for p in not_supposed:
        print(f"  {p}")
