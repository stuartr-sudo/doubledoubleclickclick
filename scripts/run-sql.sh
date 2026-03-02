#!/bin/bash
# Run SQL against the linked Supabase project via the Management API.
# Usage: ./scripts/run-sql.sh "SELECT * FROM brand_specifications LIMIT 1;"
# Or:    echo "SELECT 1;" | ./scripts/run-sql.sh

set -euo pipefail

PROJECT_REF="uscmvlfleccbctuvhhcj"

# Extract access token from macOS keychain (stored by supabase CLI)
TOKEN_RAW=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || true)
if [ -z "$TOKEN_RAW" ]; then
  echo "Error: No Supabase CLI token found in keychain. Run 'supabase login' first." >&2
  exit 1
fi
ACCESS_TOKEN=$(echo "$TOKEN_RAW" | sed 's/^go-keyring-base64://' | base64 -d)

# Get SQL from argument or stdin
if [ $# -ge 1 ]; then
  SQL="$1"
else
  SQL=$(cat)
fi

if [ -z "$SQL" ]; then
  echo "Usage: ./scripts/run-sql.sh \"SQL_QUERY\"" >&2
  exit 1
fi

curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg q "$SQL" '{query: $q}')" | jq .
