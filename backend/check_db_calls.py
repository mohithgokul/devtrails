import os

files = [
    'claims_router.py',
    'assessment_router.py',
    'policies_router.py',
    'admin_router.py',
    'trigger_engine.py',
]

for f in files:
    content = open(f, encoding='utf-8').read()
    raw_count = content.count('psycopg2.connect(DATABASE_URL)')
    has_own_url = 'DATABASE_URL = os.getenv' in content
    has_db_import = 'from db import' in content
    print(f"{f}:")
    print(f"  raw connect calls : {raw_count}")
    print(f"  own DATABASE_URL  : {has_own_url}")
    print(f"  from db import    : {has_db_import}")
    print()
