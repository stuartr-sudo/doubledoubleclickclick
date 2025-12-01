# Email Spam Protection Documentation

## Overview

This system implements comprehensive email duplicate prevention to ensure no user can submit the same email address more than once across **all forms and features**.

## Features Protected

1. **Questions Discovery** (`/find-questions`)
2. **Contact Form** (`/contact`)
3. **Lead Capture Forms** (Beta, Enterprise, Agencies, Course, Guide pages)
4. **Any custom lead capture implementations**

## How It Works

### 1. Global Email Checking

All email submissions are checked against the `lead_captures` table in Supabase:

```typescript
// lib/spam-protection.ts
export async function checkEmailExists(email: string): Promise<boolean>
```

**Key Point**: The check is **global** - it searches across ALL sources. Once an email is used anywhere, it cannot be used again.

### 2. Rate Limiting by IP

In addition to email checking, the system rate-limits by IP address:

- **1 submission per hour per IP** per source
- Prevents spam even if different emails are used
- In-memory cache (resets on server restart)

```typescript
export function isRateLimited(identifier: string): boolean
```

### 3. Source Tracking

Each submission is tagged with a source for analytics:

- `questions_discovery` - Questions Discovery tool
- `contact_form` - Contact page
- `beta_signup` - Beta program signup
- `enterprise_inquiry` - Enterprise page
- `agency_partnership` - Agencies page
- Custom sources as needed

## API Endpoint

### POST `/api/lead-capture`

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "company": "Company Name (optional)",
  "website": "https://example.com (optional)",
  "message": "User message (optional)",
  "plan_type": "Plan type (optional)",
  "source": "questions_discovery"
}
```

**Success Response (201):**
```json
{
  "success": true
}
```

**Error Response - Duplicate Email (400):**
```json
{
  "success": false,
  "error": "This email has already been registered. Each email can only be used once."
}
```

**Error Response - Rate Limited (429):**
```json
{
  "success": false,
  "error": "Too many submissions. Please try again later."
}
```

## Database Schema

### Table: `lead_captures`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | User name or identifier |
| `email` | TEXT | Email address (indexed) |
| `company` | TEXT | Company name |
| `website` | TEXT | Website URL |
| `message` | TEXT | User message/notes |
| `plan_type` | TEXT | Selected plan/tier |
| `source` | TEXT | Form source identifier |
| `ip_address` | TEXT | Submission IP address |
| `created_at` | TIMESTAMPTZ | Submission timestamp |

**Important Indexes:**
- Email index for fast duplicate checking
- Source + IP index for rate limiting

## Implementation Example

### Frontend Component

```typescript
const handleSubmit = async (email: string) => {
  const response = await fetch('/api/lead-capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      source: 'your_source_name',
      // ... other fields
    }),
  })

  const result = await response.json()

  if (!result.success) {
    if (response.status === 400) {
      // Email already exists
      alert(result.error)
    } else if (response.status === 429) {
      // Rate limited
      alert(result.error)
    }
    return
  }

  // Success - proceed with next steps
}
```

## Spam Protection Flow

```
User Submits Email
       ↓
1. Validate Email Format
       ↓
2. Get Client IP Address
       ↓
3. Check Rate Limit (IP + Source)
   → If rate limited: Return 429
       ↓
4. Check Email Exists (GLOBALLY)
   → If exists: Return 400
       ↓
5. Insert into lead_captures table
       ↓
6. Return Success
```

## Spam Protection Configuration

### Rate Limit Window

Default: **1 hour (3600000 ms)**

To modify:
```typescript
// lib/spam-protection.ts
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
```

### Email Validation

Currently checks:
- ✅ Email is required
- ✅ Email doesn't exist in database (global)
- ✅ IP address hasn't submitted recently (per source)

Future enhancements could include:
- Disposable email detection
- Email format validation (regex)
- Domain blocklist

## Security Considerations

### 1. Server-Side Only

All spam protection logic runs **server-side only**:
- Cannot be bypassed by client manipulation
- Supabase credentials never exposed to client

### 2. IP Address Privacy

IP addresses are stored but:
- Used only for rate limiting
- Not shared or exposed via API
- Comply with GDPR by including in data deletion requests

### 3. Database Security

- Row Level Security (RLS) enabled on `lead_captures` table
- Public read access disabled
- Only server-side API can write

## Testing

### Test Email Duplicate Prevention

```bash
# First submission (should succeed)
curl -X POST http://localhost:3000/api/lead-capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}'

# Second submission (should fail with 400)
curl -X POST http://localhost:3000/api/lead-capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}'
```

### Test Rate Limiting

```bash
# Rapid submissions from same IP should be rate limited after first one
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/lead-capture \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test${i}@example.com\",\"source\":\"test\"}"
  echo ""
done
```

## Monitoring

### Check for Duplicate Attempts

```sql
-- Count duplicate email attempts
SELECT email, COUNT(*) as attempts
FROM lead_captures
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY attempts DESC;
```

### Check Rate Limited IPs

```sql
-- Find IPs with multiple submissions in short time
SELECT ip_address, source, COUNT(*) as submissions,
       MAX(created_at) - MIN(created_at) as time_span
FROM lead_captures
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address, source
HAVING COUNT(*) > 1
ORDER BY submissions DESC;
```

## Troubleshooting

### Issue: "Email already exists" but user claims they haven't submitted

**Possible Causes:**
1. Email was previously used on a different form/source
2. Someone else used that email address
3. User tested the form earlier and forgot

**Solution:**
- Check database: `SELECT * FROM lead_captures WHERE email = 'user@example.com'`
- If legitimate duplicate need, manually delete old entry
- Consider adding "resend" functionality for existing emails

### Issue: Rate limit preventing legitimate submissions

**Possible Causes:**
1. Shared IP address (office/school network)
2. VPN causing IP conflicts
3. User refreshing page rapidly

**Solution:**
- Wait for rate limit window to expire (1 hour)
- Clear submission cache by restarting server
- Consider adjusting `RATE_LIMIT_WINDOW` for specific sources

## Best Practices

1. **User Messaging**: Always show clear error messages
   - "This email has already been registered"
   - "Too many attempts, please try again in 1 hour"

2. **Source Naming**: Use descriptive source names
   - ✅ `questions_discovery`
   - ✅ `enterprise_inquiry`
   - ❌ `form1`, `test`

3. **Analytics**: Track rejection reasons
   - Count duplicate email attempts
   - Monitor rate limit triggers
   - Identify abuse patterns

4. **Privacy**: Include in privacy policy
   - Email addresses are stored
   - IP addresses are logged
   - Data retention and deletion policies

## Future Enhancements

- [ ] Disposable email detection
- [ ] Email verification (confirmation link)
- [ ] CAPTCHA for suspicious patterns
- [ ] Honeypot fields for bot detection
- [ ] Configurable rate limits per source
- [ ] Admin dashboard for spam monitoring
- [ ] Automatic IP blocklist for abuse
- [ ] Integration with external spam detection APIs

## Support

For issues or questions about spam protection:
1. Check this documentation
2. Review Supabase logs for detailed errors
3. Test with curl commands to isolate issues
4. Monitor submission patterns in database

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0

