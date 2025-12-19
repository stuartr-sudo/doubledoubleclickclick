'use client';

import { useState } from 'react';

export default function ArticleReactions() {
  const [feedback, setFeedback] = useState<null | 'yes' | 'no'>(null);

  const handleFeedback = (type: 'yes' | 'no') => {
    setFeedback(type);
    // In a real app, you'd send this to Supabase or an analytics tool
  };

  return (
    <section className="article-reactions">
      <h3 className="reactions-title">
        {feedback ? 'Thanks for your feedback!' : 'Was this article helpful?'}
      </h3>
      
      <div className="reaction-container">
        {!feedback ? (
          <div className="feedback-buttons">
            <button 
              className="reaction-btn yes-btn"
              onClick={() => handleFeedback('yes')}
              aria-label="Yes, this was helpful"
            >
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <span className="btn-text">Yes</span>
            </button>

            <button 
              className="reaction-btn no-btn"
              onClick={() => handleFeedback('no')}
              aria-label="No, this was not helpful"
            >
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                </svg>
              </div>
              <span className="btn-text">No</span>
            </button>
          </div>
        ) : (
          <div className={`feedback-result ${feedback}`}>
            <div className="icon-wrapper large">
              {feedback === 'yes' ? (
                <svg viewBox="0 0 24 24" fill="#0066cc" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="#dc3545" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                </svg>
              )}
            </div>
            <p className="thanks-text">
              {feedback === 'yes' 
                ? 'Glad you found this helpful!' 
                : "Sorry to hear that. We'll try to improve!"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
