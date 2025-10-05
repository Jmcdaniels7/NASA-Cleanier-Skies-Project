import React, { useState, useEffect } from 'react';
import './NewsSection.css';

const NewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Search for air quality and pollution related news only
        const response = await fetch(
          `https://newsapi.org/v2/everything?q="air quality" OR "air pollution" OR "PM2.5" OR smog OR emissions&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();

        // Filter to only show articles actually about air quality/pollution/climate
        const filteredArticles = (data.articles || []).filter(article => {
          const text = `${article.title} ${article.description || ''}`.toLowerCase();
          return text.includes('air') || text.includes('pollution') || text.includes('quality') ||
                 text.includes('pm2.5') || text.includes('smog') || text.includes('emission') ||
                 text.includes('climate') || text.includes('environment');
        });

        console.log('Filtered articles:', filteredArticles.length);
        setArticles(filteredArticles);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Unable to load news articles');
      } finally {
        setLoading(false);
      }
    };

    if (NEWS_API_KEY) {
      fetchNews();
    } else {
      setError('News API key not configured');
      setLoading(false);
    }
  }, [NEWS_API_KEY]);

  if (loading) {
    return (
      <div className="news-section">
        <div className="news-header">
          <h2>📰 Air Quality News & Insights</h2>
        </div>
        <div className="news-loading">
          <div className="news-spinner"></div>
          <p>Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-section">
        <div className="news-header">
          <h2>📰 Air Quality News & Insights</h2>
        </div>
        <div className="news-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-section">
      <div className="news-header">
        <h2>🌍 Climate News</h2>
      </div>

      <div className="news-grid">
        {articles.slice(0, 5).map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <h3 className="news-title">{article.title}</h3>
            <div className="news-meta">
              <span className="news-source">{article.source?.name}</span>
              <span className="news-date">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
