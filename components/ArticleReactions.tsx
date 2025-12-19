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
          className={`heart-btn ${hasLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={hasLiked}
          aria-label="Like this article"
        >
          {!hasLiked && <span className="tap-hint">Tap to react</span>}
          <div className="heart-wrapper">
            <svg viewBox="0 0 24 24" fill={hasLiked ? "#ff0050" : "none"} stroke={hasLiked ? "#ff0050" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {hasLiked && <div className="particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>}
          </div>
          <span className="like-count">{likes}</span>
        </button>
      </div>
      {hasLiked && <p className="thanks-text">Thanks for the love!</p>}
    </section>
  );
}
