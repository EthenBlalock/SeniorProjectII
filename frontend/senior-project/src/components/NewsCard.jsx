import React from 'react';
import './NewsCard.css';

const NewsCard = ({ article }) => {
  const {
    source,
    author,
    title,
    description,
    url,
    urlToImage,
    publishedAt,
  } = article;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle broken images
  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%231a1d23" width="400" height="225"/%3E%3Ctext fill="%2322c55e" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="news-card"
    >
      <div className="news-card-image-wrapper">
        <img 
          src={urlToImage || 'https://via.placeholder.com/400x225/1a1d23/22c55e?text=No+Image'} 
          alt={title}
          className="news-card-image"
          onError={handleImageError}
        />
        <div className="news-card-overlay">
          <span className="read-more-btn">Read Full Article →</span>
        </div>
        {source?.name && (
          <div className="news-source-badge">
            {source.name}
          </div>
        )}
      </div>

      <div className="news-card-content">
        <div className="news-card-meta">
          <span className="news-date">{formatDate(publishedAt)}</span>
          {author && (
            <>
              <span className="news-divider">•</span>
              <span className="news-author">{author}</span>
            </>
          )}
        </div>

        <h3 className="news-card-title">{title}</h3>
        
        {description && (
          <p className="news-card-description">
            {description.length > 150 
              ? `${description.substring(0, 150)}...` 
              : description
            }
          </p>
        )}

        <div className="news-card-footer">
          <span className="news-category">📈 Market News</span>
          <span className="news-arrow">→</span>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;
