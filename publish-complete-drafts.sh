#!/bin/bash

echo "🔍 Finding draft posts with slugs (complete posts)..."
echo ""

# Get all draft posts
curl -s "https://www.sewo.io/api/blog?status=draft&limit=100" | python3 << 'EOF'
import sys, json, urllib.request

data = json.load(sys.stdin)
posts = data.get('data', [])

# Find drafts that have slugs (complete posts)
complete_drafts = [p for p in posts if p.get('slug')]

print(f"Found {len(complete_drafts)} complete draft posts")
print("")

if len(complete_drafts) == 0:
    print("No complete drafts to publish")
    sys.exit(0)

print("Posts that will be published:")
for i, p in enumerate(complete_drafts[:10], 1):  # Show first 10
    print(f"{i}. {p['title'][:60]}")

if len(complete_drafts) > 10:
    print(f"... and {len(complete_drafts) - 10} more")

print("")
print("⚠️  THIS WILL PUBLISH THESE POSTS!")
print("")
response = input("Continue? (yes/no): ")

if response.lower() != 'yes':
    print("Cancelled")
    sys.exit(0)

print("")
print("Publishing posts...")
print("")

# Publish each post
for post in complete_drafts:
    post_id = post['id']
    title = post['title'][:50]
    
    # Update status to published
    update_data = {
        "status": "published"
    }
    
    req = urllib.request.Request(
        f"https://www.sewo.io/api/blog/{post_id}",
        data=json.dumps(update_data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"✅ Published: {title}")
    except Exception as e:
        print(f"❌ Failed: {title} - {e}")

print("")
print(f"✅ Done! Published {len(complete_drafts)} posts")
print("Visit https://www.sewo.io/blog to see them")
EOF

