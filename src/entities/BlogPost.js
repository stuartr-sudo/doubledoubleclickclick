// BlogPost entity - matches original Base44 structure
import { createEntityWrapper } from '@/api/entities';

export const BlogPost = createEntityWrapper('BlogPost');

// Add specific methods for BlogPost
BlogPost.findById = async (id) => {
  const response = await fetch('/api/blog-posts/find', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await (await import('@/api/supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ id })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to find blog post: ${response.statusText}`);
  }
  
  return response.json();
};
