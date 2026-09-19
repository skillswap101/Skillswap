#!/usr/bin/env python3
from pathlib import Path
import argparse, datetime as dt, re, shutil
ROOT=Path.cwd(); TARGET=ROOT/'src/hooks/useCloudStateBridge.ts'; STAMP=dt.datetime.now().strftime('%Y%m%d-%H%M%S'); BACKUP=ROOT.parent/f'{ROOT.name}.backup-phase1-1-{STAMP}'; REPORT=ROOT/'PHASE1_1_REPORT.md'
def main():
 ap=argparse.ArgumentParser(); ap.add_argument('--dry-run',action='store_true'); a=ap.parse_args()
 if not TARGET.exists(): raise SystemExit(f'Missing {TARGET}')
 text=TARGET.read_text()
 bad=re.compile(r'''\n\s*useEffect\(\(\)\s*=>\s*\{\s*if\s*\(userProfile\)\s*\{\s*setCurrentUserState\(userProfile\s+as\s+User\);\s*\}\s*else\s+if\s*\(!firebaseUser\s+&&\s*!authLoading\)\s*\{\s*//\s*No\s+authenticated\s+identity:.*?setCurrentUserState\(CURRENT_USER\s+as\s+User\);\s*\}\s*\},\s*\[userProfile,\s*firebaseUser,\s*authLoading\]\);''',re.S)
 text2,n=bad.subn('\n',text,count=1)
 changes=[]
 if n: changes.append('Removed invalid useEffect from the TypeScript interface.')
 marker='  const uidRef = useRef<string | null>(null);\n'
 if 'Phase 1 identity synchronization:' not in text2:
  if marker not in text2: raise SystemExit('Could not find uidRef marker.')
  effect='''  // Phase 1 identity synchronization:\n  // Firebase Auth/AuthContext is authoritative. Never restore an old\n  // skillswap_user or CURRENT_USER as an authenticated identity.\n  useEffect(() => {\n    if (userProfile) {\n      setCurrentUserState(userProfile as User);\n      uidRef.current = firebaseUser?.uid ?? userProfile.id ?? null;\n      setAuthenticated(Boolean(firebaseUser));\n      return;\n    }\n    uidRef.current = firebaseUser?.uid ?? null;\n    setAuthenticated(Boolean(firebaseUser));\n    if (!firebaseUser && !authLoading) setError("Authentication required.");\n  }, [userProfile, firebaseUser, authLoading]);\n\n'''
  text2=text2.replace(marker,marker+effect,1); changes.append('Inserted identity synchronization inside useCloudStateBridge.')
 old='''  const [currentUser, setCurrentUserState] = useState<User>(() =>\n    (userProfile || CURRENT_USER) as User\n  );'''
 new='''  const [currentUser, setCurrentUserState] = useState<User>(() =>\n    (userProfile || {}) as User\n  );'''
 if old in text2: text2=text2.replace(old,new,1); changes.append('Removed CURRENT_USER from currentUser state initialization.')
 if text2.count('{')!=text2.count('}'): raise SystemExit('Validation failed: unmatched braces.')
 if a.dry_run:
  print('DRY RUN'); [print(' -',x) for x in changes]; return
 shutil.copytree(ROOT,BACKUP,ignore=shutil.ignore_patterns('node_modules','.git','dist','build'))
 TARGET.write_text(text2)
 REPORT.write_text('# SkillSwap Phase 1.1 Correction Report\n\n'+'\n'.join('- '+x for x in changes)+f'\n\nBackup: {BACKUP}\n\nNext: run `npm run build`\n')
 print('Completed.'); print('Backup:',BACKUP); print('Report:',REPORT)
if __name__=='__main__': main()
