import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SimpleEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postId = searchParams.get('post');
        
        if (!postId) {
          setError('No post ID provided');
          setLoading(false);
          return;
        }

        console.log('Loading post with ID:', postId);

        // Load the blog post directly from Supabase
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) {
          console.error('Error loading post:', error);
          setError('Failed to load post: ' + error.message);
          setLoading(false);
          return;
        }

        console.log('Loaded post:', data);
        setPost(data);
        setLoading(false);

      } catch (err) {
        console.error('Error in loadPost:', err);
        setError('Error loading post: ' + err.message);
        setLoading(false);
      }
    };

    loadPost();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/gettingstarted')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back to Getting Started
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Post Not Found</h1>
          <p className="text-slate-600 mb-4">The requested post could not be found.</p>
          <button 
            onClick={() => navigate('/gettingstarted')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back to Getting Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/gettingstarted')}
            className="bg-gray-500 text-white px-4 py-2 rounded mb-4"
          >
            ← Back to Getting Started
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{post.title || 'Untitled Post'}</h1>
          <p className="text-slate-600 mt-2">Post ID: {post.id}</p>
        </div>
        
        <div className="prose max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content || '<p>No content available</p>' }}
          />
        </div>
      </div>
    </div>
  );
}
