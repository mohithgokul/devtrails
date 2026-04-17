import os

files = [
    'claims_router.py',
    'policies_router.py',
    'admin_router.py',
    'trigger_engine.py'
]

for file_name in files:
    with open(file_name, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace OS import and DATABASE_URL
    content = content.replace(
        'DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/surakshapay")',
        'from db import get_connection, get_dict_connection'
    )

    # Note: If claims_router.py already has "from db import", this won't break anything, 
    # but let's be safe and just do the psycopg2 replacements.
    
    # Replace dict connections
    content = content.replace(
        'conn = psycopg2.connect(DATABASE_URL)\n    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)',
        'conn = get_dict_connection()\n    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)'
    )
    content = content.replace(
        'conn = psycopg2.connect(DATABASE_URL)\n        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)',
        'conn = get_dict_connection()\n        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)'
    )
    
    # Replace normal connections
    content = content.replace(
        'conn = psycopg2.connect(DATABASE_URL)\n    cursor = conn.cursor()',
        'conn = get_connection()\n    cursor = conn.cursor()'
    )
    content = content.replace(
        'conn   = psycopg2.connect(DATABASE_URL)\n    cursor = conn.cursor()',
        'conn   = get_connection()\n    cursor = conn.cursor()'
    )
    
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(content)

print("DB calls replaced.")
