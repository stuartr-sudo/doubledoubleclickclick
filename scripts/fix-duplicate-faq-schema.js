/**
 * Script to remove FAQPage schema from blog posts
 * This fixes duplicate FAQPage errors in Google Search Console
 * 
 * Run with: node scripts/fix-duplicate-faq-schema.js
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Try to load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateFAQSchema() {
  console.log('🔍 Fetching all blog posts...')
  
  // Get all published posts with generated_llm_schema
  const { data: posts, error: fetchError } = await supabase
    .from('site_posts')
    .select('id, slug, title, generated_llm_schema')
    .eq('status', 'published')
    .not('generated_llm_schema', 'is', null)

  if (fetchError) {
    console.error('❌ Error fetching posts:', fetchError)
    process.exit(1)
  }

  if (!posts || posts.length === 0) {
    console.log('✅ No posts with generated_llm_schema found')
    return
  }

  console.log(`📝 Found ${posts.length} posts with generated_llm_schema`)
  
  let fixedCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      if (!post.generated_llm_schema) continue

      let schema
      try {
        schema = JSON.parse(post.generated_llm_schema)
      } catch (e) {
        console.log(`⚠️  Skipping post ${post.slug}: Invalid JSON in generated_llm_schema`)
        continue
      }

      let needsUpdate = false
      let updatedSchema = schema

      // Check if schema contains FAQPage
      if (schema['@type'] === 'FAQPage') {
        // Entire schema is FAQPage - remove it
        console.log(`🗑️  Post ${post.slug}: Removing FAQPage schema (entire schema was FAQPage)`)
        needsUpdate = true
        updatedSchema = null
      } else if (schema['@graph'] && Array.isArray(schema['@graph'])) {
        // Schema has @graph array - filter out FAQPage
        const originalLength = schema['@graph'].length
        schema['@graph'] = schema['@graph'].filter((item) => {
          if (item['@type'] === 'FAQPage') {
            console.log(`🗑️  Post ${post.slug}: Removing FAQPage from @graph`)
            return false
          }
          return true
        })
        
        if (schema['@graph'].length < originalLength) {
          needsUpdate = true
          updatedSchema = schema
          
          // If @graph is now empty, remove the entire schema
          if (schema['@graph'].length === 0) {
            updatedSchema = null
          }
        }
      } else if (schema['@type'] && schema['@type'].includes('FAQPage')) {
        // Check if @type is an array containing FAQPage
        if (Array.isArray(schema['@type'])) {
          schema['@type'] = schema['@type'].filter(type => type !== 'FAQPage')
          if (schema['@type'].length === 0) {
            updatedSchema = null
          } else {
            updatedSchema = schema
          }
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('site_posts')
          .update({
            generated_llm_schema: updatedSchema ? JSON.stringify(updatedSchema) : null
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`❌ Error updating post ${post.slug}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ Fixed post: ${post.slug}`)
          fixedCount++
        }
      }
    } catch (error) {
      console.error(`❌ Error processing post ${post.slug}:`, error)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`✅ Fixed: ${fixedCount} posts`)
  console.log(`❌ Errors: ${errorCount} posts`)
  console.log(`📝 Total processed: ${posts.length} posts`)
}

// Run the script
fixDuplicateFAQSchema()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
