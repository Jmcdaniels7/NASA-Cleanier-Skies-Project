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

        // Reliable news sources for climate/environment news
        const reliableSources = 'bbc-news,the-washington-post,reuters,the-guardian,associated-press,cnn,abc-news,nbc-news,axios,politico,national-geographic,the-new-york-times';

        // Search for air quality and pollution related news from reliable sources
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=("air quality" OR "air pollution" OR "PM2.5" OR "PM10" OR smog OR "nitrogen dioxide" OR ozone) AND (pollution OR quality OR health OR emissions)&sources=${reliableSources}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${NEWS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();

        // Strict filter: must have air quality/pollution keywords
        const filteredArticles = (data.articles || []).filter(article => {
          const text = `${article.title} ${article.description || ''}`.toLowerCase();
          const hasAirQuality = text.includes('air quality') || text.includes('air pollution') ||
                                text.includes('pm2.5') || text.includes('pm10') ||
                                text.includes('smog') || text.includes('nitrogen dioxide') ||
                                text.includes('ozone') || text.includes('aqi');
          const hasPollution = text.includes('pollution') || text.includes('emission') ||
                               text.includes('pollutant');

          return hasAirQuality || hasPollution;
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
