import { useState, useCallback, useMemo } from "react";
import { Log } from "../LoggingMiddleware/index";

type UrlEntry = {
  id: string;
  original: string;
  short: string;
  expiry: string;
  createdAt: Date;
  status: 'pending' | 'success' | 'error';
  error?: string;
};

type Props = {
  urls: UrlEntry[];
};

export default function UrlStatisticsPage({ urls }: Props) {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUrls = useMemo(() => {
    let filtered = urls;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(url => url.status === filter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(url => 
        url.original.toLowerCase().includes(term) ||
        url.short.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [urls, filter, searchTerm]);

  const statistics = useMemo(() => {
    const total = urls.length;
    const successful = urls.filter(url => url.status === 'success').length;
    const failed = urls.filter(url => url.status === 'error').length;
    const pending = urls.filter(url => url.status === 'pending').length;
    
    return { total, successful, failed, pending };
  }, [urls]);

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      Log("frontend", "info", "component", "URL copied to clipboard").catch(console.warn);
    } catch (e) {
      Log("frontend", "error", "component", "Failed to copy URL to clipboard").catch(console.warn);
    }
  }, []);

  const handleUrlClick = useCallback((originalUrl: string, shortUrl: string) => {
    // If it's a custom shortcode URL, open the original URL
    if (shortUrl.includes('short.ly/')) {
      window.open(originalUrl, '_blank');
    } else {
      // For TinyURL and other services, open the short URL
      window.open(shortUrl, '_blank');
    }
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatExpiry = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return 'Expired';
    } else if (diffMins < 60) {
      return `${diffMins} minutes left`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hours left`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} days left`;
    }
  };

  return (
    <div className="url-statistics-page">
      <h1>URL Shortener Statistics</h1>
      
      {/* Statistics Overview */}
      <div className="statistics-overview">
        <div className="stat-card total">
          <h3>Total URLs</h3>
          <span className="stat-number">{statistics.total}</span>
        </div>
        <div className="stat-card successful">
          <h3>Successful</h3>
          <span className="stat-number">{statistics.successful}</span>
        </div>
        <div className="stat-card failed">
          <h3>Failed</h3>
          <span className="stat-number">{statistics.failed}</span>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <span className="stat-number">{statistics.pending}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filter-controls">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({statistics.total})
            </button>
            <button 
              className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
              onClick={() => setFilter('success')}
            >
              Successful ({statistics.successful})
            </button>
            <button 
              className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              Failed ({statistics.failed})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({statistics.pending})
            </button>
          </div>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* URLs List */}
      <div className="urls-list">
        <h2>URL Details ({filteredUrls.length} results)</h2>
        
        {filteredUrls.length === 0 ? (
          <div className="no-results">
            <p>No URLs found matching your criteria.</p>
          </div>
        ) : (
          filteredUrls.map((url) => (
            <div key={url.id} className={`url-item ${url.status}`}>
              <div className="url-content">
                <div className="url-header">
                  <div className="url-status-badge">
                    {url.status === 'success' && <span className="badge success">✓ Success</span>}
                    {url.status === 'error' && <span className="badge error">✗ Error</span>}
                    {url.status === 'pending' && <span className="badge pending">⏳ Pending</span>}
                  </div>
                  <div className="url-date">
                    Created: {formatDate(url.createdAt)}
                  </div>
                </div>
                
                <div className="url-original">
                  <strong>Original URL:</strong>
                  <a href={url.original} target="_blank" rel="noopener noreferrer">
                    {url.original}
                  </a>
                </div>
                
                {url.status === 'success' && (
                  <>
                    <div className="url-short">
                      <strong>Shortened URL:</strong>
                      <button 
                        onClick={() => handleUrlClick(url.original, url.short)}
                        className="url-link-btn"
                        title="Click to visit"
                      >
                        {url.short}
                      </button>
                      <button 
                        onClick={() => handleCopyUrl(url.short)}
                        className="copy-btn"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                    <div className="url-expiry">
                      <strong>Expiry:</strong> {formatExpiry(url.expiry)}
                    </div>
                  </>
                )}
                
                {url.status === 'error' && (
                  <div className="url-error">
                    <strong>Error:</strong> {url.error}
                  </div>
                )}
                
                {url.status === 'pending' && (
                  <div className="url-pending">
                    <strong>Status:</strong> Processing...
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 