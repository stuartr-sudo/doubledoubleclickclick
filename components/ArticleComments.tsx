'use client';

import { useState } from 'react';

export default function ArticleComments({ postSlug }: { postSlug: string }) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const stripLinks = (text: string) => {
    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,10}[^\s]*)/gi;
    return text.replace(urlRegex, '[link removed]');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setStatus('pending');
    
    // Simulate API call and link removal
    const cleanComment = stripLinks(comment);
    
    // In a real app, you would POST to /api/comments
    // For now, we simulate the 'pending approval' state
    setTimeout(() => {
      setStatus('success');
      setComment('');
    }, 1500);
  };

  return (
    <section className="comments-section">
      <h3>Community Discussion</h3>
      
      <div className="comment-form">
        <form onSubmit={handleSubmit}>
          <div className="comment-input-wrapper">
            <label htmlFor="comment-text">Join the conversation</label>
            <div className="comment-input-area">
              <textarea 
                id="comment-text"
                placeholder="Share your thoughts... (links are not allowed and will be removed)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={status === 'pending' || status === 'success'}
              ></textarea>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="comment-submit-btn"
            disabled={status === 'pending' || status === 'success' || !comment.trim()}
          >
            {status === 'pending' ? 'Sending...' : 'Post Comment'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {status === 'success' && (
            <div className="comment-status-box pending">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Thank you! Your comment has been submitted and is <strong>awaiting moderator approval</strong>.</span>
            </div>
          )}

          {status === 'error' && (
            <div className="comment-status-box error">
              <span>{errorMessage || 'Something went wrong. Please try again.'}</span>
            </div>
          )}
          
          <p className="comment-note">
            To maintain a high-quality discussion, all comments are reviewed by our team before appearing live. 
            Links are automatically removed to prevent spam.
          </p>
        </form>
      </div>

      <div className="comment-placeholder">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    </section>
  );
}

