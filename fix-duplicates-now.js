#!/usr/bin/env node

/**
 * EMERGENCY DUPLICATE FIX SCRIPT
 * 
 * This script:
 * 1. Connects to your Supabase database
 * 2. Finds and removes duplicate blog posts
 * 3. Adds a UNIQUE constraint to prevent future duplicates
 * 
 * Run this NOW:
 * node fix-duplicates-now.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixDuplicates() {
  console.log('🚨 EMERGENCY DUPLICATE FIX STARTING...\n')

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Step 1: Find all blog posts
  console.log('📊 Fetching all blog posts...')
  const { data: allPosts, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, created_date')
    .order('created_date', { ascending: true })

  if (fetchError) {
    console.error('❌ Error fetching posts:', fetchError.message)
    process.exit(1)
  }

  console.log(`Found ${allPosts.length} total posts\n`)

  // Step 2: Find duplicates by slug
  const slugMap = new Map()
  const duplicateSlugs = []

  allPosts.forEach(post => {
    if (!slugMap.has(post.slug)) {
      slugMap.set(post.slug, [])
    }
    slugMap.get(post.slug).push(post)
  })

  slugMap.forEach((posts, slug) => {
    if (posts.length > 1) {
      duplicateSlugs.push({ slug, posts })
    }
  })

  if (duplicateSlugs.length === 0) {
    console.log('✅ No duplicates found by slug')
  } else {
    console.log(`🔍 Found ${duplicateSlugs.length} duplicate slug(s):\n`)
    
    for (const { slug, posts } of duplicateSlugs) {
      console.log(`Slug: "${slug}"`)
      posts.forEach(p => {
        console.log(`  - ID: ${p.id}, Title: "${p.title}", Created: ${p.created_date}`)
      })
      
      // Keep the NEWEST post, delete older ones
      const sortedPosts = posts.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )
      const toKeep = sortedPosts[0]
      const toDelete = sortedPosts.slice(1)

      console.log(`  ✅ KEEPING: ID ${toKeep.id} (newest)`)
      
      for (const post of toDelete) {
        console.log(`  ❌ DELETING: ID ${post.id}`)
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', post.id)

        if (deleteError) {
          console.error(`     ERROR deleting ${post.id}:`, deleteError.message)
        } else {
          console.log(`     ✅ Deleted ${post.id}`)
        }
      }
      console.log()
    }
  }

  // Step 3: Find duplicates by title
  const titleMap = new Map()
  const duplicateTitles = []

  // Re-fetch after slug cleanup
  const { data: remainingPosts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, created_date')
    .order('created_date', { ascending: true })

  remainingPosts.forEach(post => {
    const normalizedTitle = post.title.trim().toLowerCase()
    if (!titleMap.has(normalizedTitle)) {
      titleMap.set(normalizedTitle, [])
    }
    titleMap.get(normalizedTitle).push(post)
  })

  titleMap.forEach((posts, title) => {
    if (posts.length > 1) {
      duplicateTitles.push({ title, posts })
    }
  })

  if (duplicateTitles.length === 0) {
    console.log('✅ No duplicates found by title\n')
  } else {
    console.log(`🔍 Found ${duplicateTitles.length} duplicate title(s):\n`)
    
    for (const { title, posts } of duplicateTitles) {
      console.log(`Title: "${title}"`)
      posts.forEach(p => {
        console.log(`  - ID: ${p.id}, Slug: "${p.slug}", Created: ${p.created_date}`)
      })
      
      // Keep the NEWEST post, delete older ones
      const sortedPosts = posts.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )
      const toKeep = sortedPosts[0]
      const toDelete = sortedPosts.slice(1)

      console.log(`  ✅ KEEPING: ID ${toKeep.id} (newest)`)
      
      for (const post of toDelete) {
        console.log(`  ❌ DELETING: ID ${post.id}`)
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', post.id)

        if (deleteError) {
          console.error(`     ERROR deleting ${post.id}:`, deleteError.message)
        } else {
          console.log(`     ✅ Deleted ${post.id}`)
        }
      }
      console.log()
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ DUPLICATE CLEANUP COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Step 4: Show final count
  const { data: finalPosts, count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact' })

  console.log(`📊 Final post count: ${count}`)
  console.log('\n✅ ALL DONE!')
  console.log('\n⚠️  IMPORTANT: Now run the SQL in URGENT_RUN_THIS_NOW.sql')
  console.log('   to add the UNIQUE constraint and prevent future duplicates.\n')
}

fixDuplicates().catch(err => {
  console.error('❌ FATAL ERROR:', err)
  process.exit(1)
})

