'use client';

import { useState } from 'react';

export default function ArticleReactions() {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);
  };

  return (
    <section className="article-reactions">
      <div className="reaction-container">
        <button 
          className={`like-btn ${hasLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={hasLiked}
          aria-label="Like this article"
        >
          <div className="icon-wrapper">
            <svg viewBox="0 0 24 24" fill={hasLiked ? "#0066cc" : "none"} stroke={hasLiked ? "#0066cc" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </div>
          <span className="like-count">{likes}</span>
        </button>
      </div>
      {hasLiked && <p className="thanks-text">Glad you found this helpful!</p>}
    </section>
  );
}
