// Simplified test blog posts with only essential fields
import { BlogPost } from './entities.js';
import { getCurrentUser } from '../lib/supabase.js';

const simpleTestPosts = [
  {
    title: "Test Post: AI in Content Creation",
    html: "<h1>The Future of AI in Content Creation</h1><p>Artificial Intelligence is revolutionizing how we create content.</p>",
    status: "draft"
  },
  {
    title: "Test Post: SEO Strategies",
    html: "<h1>SEO Strategies for 2024</h1><p>Search Engine Optimization continues to evolve.</p>",
    status: "draft"
  },
  {
    title: "Test Post: Content Marketing",
    html: "<h1>Content Marketing Strategy</h1><p>Content marketing is more than just creating blog posts.</p>",
    status: "published"
  },
  {
    title: "Test Post: Web Design",
    html: "<h1>Color Psychology in Web Design</h1><p>Colors have a profound impact on user behavior.</p>",
    status: "draft"
  },
  {
    title: "Test Post: React Tutorial",
    html: "<h1>Getting Started with React</h1><p>React is one of the most popular JavaScript libraries.</p>",
    status: "published"
  }
];

export async function createSimpleTestPosts() {
  try {
    console.log('🧪 Creating simple test blog posts...');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const createdPosts = [];
    
    for (const postData of simpleTestPosts) {
      const blogPost = {
        ...postData,
        user_id: user.id
      };
      
      const createdPost = await BlogPost.create(blogPost);
      createdPosts.push(createdPost);
      console.log(`✅ Created blog post: "${createdPost.title}"`);
    }
    
    console.log(`🎉 Successfully created ${createdPosts.length} test blog posts`);
    return createdPosts;
    
  } catch (error) {
    console.error('❌ Error creating test blog posts:', error);
    throw error;
  }
}
