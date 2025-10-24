// Test Data Creation Script
// Run this to create test blog posts for editor testing

import { createTestBlogPosts } from './create-test-blog-posts.js';

// Function to run from browser console or component
export async function runTestDataCreation() {
  try {
    console.log('🚀 Starting test data creation...');
    
    const result = await createTestBlogPosts();
    
    console.log('✅ Test data creation completed successfully!');
    console.log('Created blog posts:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.runTestDataCreation = runTestDataCreation;
  console.log('💡 Run "runTestDataCreation()" in the console to create test blog posts');
}
