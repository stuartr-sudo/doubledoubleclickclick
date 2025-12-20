'use client';

import { useState, useRef, useEffect } from 'react';

export default function ArticleComments({ postSlug }: { postSlug: string }) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [comment]);

  const stripLinks = (text: string) => {
    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,10}[^\s]*)/gi;
    return text.replace(urlRegex, '[link removed]');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setStatus('pending');
    
    // Auto-remove links: detect URLs and replace with empty string or note
    const cleanComment = comment.replace(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,10}[^\s]*)/gi, '[link removed]');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setComment('');
    }, 1500);
  };

  return (
    <section className="comments-section">
      <div className="comments-container">
        <div className="comments-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>Community Discussion</h3>
        </div>
        
        <div className="comment-form-card">
          <form onSubmit={handleSubmit}>
            <div className="comment-input-group">
              <textarea 
                ref={textareaRef}
                id="comment-text"
                className="force-dark-text"
                placeholder="What are your thoughts? (Links will be removed automatically)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={status === 'pending' || status === 'success'}
                rows={1}
              ></textarea>
              <div className="comment-footer">
                <p className="comment-policy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Comments are moderated
                </p>
                <button 
                  type="submit" 
                  className="comment-post-btn"
                  disabled={status === 'pending' || status === 'success' || !comment.trim()}
                >
                  {status === 'pending' ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>

            {status === 'success' && (
              <div className="comment-status-message success">
                <div className="status-icon">✓</div>
                <div className="status-text">
                  <strong>Success!</strong> Your comment is in the queue for moderator review.
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="comment-list-placeholder">
          <div className="placeholder-content">
            <p>Be the first to share your thoughts on this article.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

