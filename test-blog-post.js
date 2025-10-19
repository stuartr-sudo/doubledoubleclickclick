// Test script to check if blog post exists
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlogPost() {
  try {
    // Test if we can access the blog_posts table
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error accessing blog_posts table:', error);
      return;
    }

    console.log('Blog posts found:', data);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testBlogPost();
