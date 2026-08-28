import os
import sys

def search_dir(path, term):
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'supabase', '.pytest_cache')]
        for f in files:
            if not f.endswith(('.ts', '.tsx', '.py', '.js', '.jsx', '.json')):
                continue
            fp = os.path.join(root, f)
            try:
                with open(fp, 'r', encoding='utf-8') as file:
                    for i, line in enumerate(file):
                        if term in line:
                            print(f"{fp}:{i+1}: {line.strip()}")
            except Exception:
                pass

search_dir('.', 'Pipeline Health')
search_dir('.', 'MSRC')
search_dir('.', '8/8 healthy')
