
import os
import subprocess

# Allowed prefixes/keywords based on User's "Pure Stack" request
ALLOWED_PREFIXES = [
    'VITE_SUPABASE',
    'SUPABASE',
    'STRIPE',
    'VITE_STRIPE',
    'OPENROUTER',
    'VITE_APP',
    'ADMIN',
    'VITE_SITE_URL'
]

# Explicitly blocked keywords to ensure third-party removal
BLOCKED_KEYWORDS = [
    'POSTHOG',
    'SENTRY',
    'LIVEKIT',
    'R2_',
    'CLOUDFLARE',
    'AWS'
]

def migrate_env():
    print("Starting Pure Stack Environment Migration...")
    print("Allowed: Supabase, Stripe, OpenRouter, Vercel")
    
    try:
        with open('.env.local', 'r') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("Error: .env.local not found")
        return

    migrated_count = 0
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        try:
            if '=' not in line:
                continue
                
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()
            
            # 1. Filter out empty values
            if not value:
                print(f"Skipping empty key: {key}")
                continue
                
            # 2. Check Blocklist
            if any(blocked in key for blocked in BLOCKED_KEYWORDS):
                print(f"Skipping blocked third-party key: {key}")
                continue
                
            # 3. Check Allowlist
            if not any(key.startswith(prefix) for prefix in ALLOWED_PREFIXES):
                print(f"Skipping non-core key: {key}")
                continue

            # Remove quotes if present
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            
            print(f"✅ Migrating core key: {key}")
            
            # Add to production, preview, development
            targets = ['production', 'preview', 'development']
            for target in targets:
                # Using 'echo -n' to prevent newline issues
                # Note: 'vercel env add' reads from stdin, syntax: vercel env add <name> <target>
                cmd = f'echo -n "{value}" | vercel env add {key} {target}'
                
                # Execute
                subprocess.run(cmd, shell=True, executable='/bin/bash', stdout=subprocess.DEVNULL)
            
            migrated_count += 1
                
        except ValueError:
            print(f"Skipping malformed line: {line}")
            
    print(f"\nMigration Complete. {migrated_count} core variables synced to Vercel.")

if __name__ == "__main__":
    migrate_env()
