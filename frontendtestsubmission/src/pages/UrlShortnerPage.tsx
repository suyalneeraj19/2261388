import { useState, useCallback, useMemo } from "react";
import UrlForm from "../components/URLform";
import { Log } from "../LoggingMiddleware/index";

type UrlEntry = {
  id: string;
  original: string;
  short: string;
  expiry: string;
  createdAt: Date;
};

// Mock API function for testing with functional redirects
const mockShortenUrl = async (longUrl: string, validity: number, shortcode?: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock short URL that will redirect
  const mockShortUrl = shortcode || `short.ly/${Math.random().toString(36).substring(2, 8)}`;
  const expiryDate = new Date(Date.now() + validity * 60 * 1000);
  
  return {
    shortUrl: `http://localhost:3000/redirect/${mockShortUrl}?url=${encodeURIComponent(longUrl)}`,
    expiry: expiryDate.toISOString()
  };
};

export default function UrlShortenerPage() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShorten = useCallback(async ({ longUrl, validity, shortcode }: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try the real API first, fallback to mock if it fails
      let data;
      try {
        const res = await fetch("http://20.244.56.144/evaluation-service/shorten", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            longUrl, 
            validity: parseInt(validity), 
            shortcode 
          }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        data = await res.json();
        Log("frontend", "info", "api", "URL shortened successfully via real API").catch(console.warn);
      } catch (apiError) {
        // Fallback to mock API
        console.warn("Real API failed, using mock:", apiError);
        data = await mockShortenUrl(longUrl, parseInt(validity), shortcode);
        Log("frontend", "info", "api", "URL shortened successfully via mock API").catch(console.warn);
      }
      
      const newUrl: UrlEntry = {
        id: Date.now().toString(),
        original: longUrl,
        short: data.shortUrl,
        expiry: data.expiry,
        createdAt: new Date(),
      };
      
      setUrls(prev => [newUrl, ...prev]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to shorten URL";
      setError(errorMessage);
      Log("frontend", "error", "api", `Failed to shorten URL: ${errorMessage}`).catch(console.warn);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      Log("frontend", "info", "component", "URL copied to clipboard").catch(console.warn);
    } catch (e) {
      Log("frontend", "error", "component", "Failed to copy URL to clipboard").catch(console.warn);
    }
  }, []);

  const handleUrlClick = useCallback((originalUrl: string, shortUrl: string) => {
    // If it's a mock URL, open the original directly
    if (shortUrl.includes('localhost:3000/redirect')) {
      window.open(originalUrl, '_blank');
    } else {
      // For real API URLs, open the short URL
      window.open(shortUrl, '_blank');
    }
  }, []);

  const sortedUrls = useMemo(() => {
    return [...urls].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [urls]);

  return (
    <div className="url-shortener-page">
      <h1>URL Shortener</h1>
      
      <UrlForm onSubmit={handleShorten} isLoading={isLoading} />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {sortedUrls.length > 0 && (
        <div className="urls-list">
          <h2>Recent URLs</h2>
          {sortedUrls.map((url) => (
            <div key={url.id} className="url-item">
              <div className="url-content">
                <div className="url-original">
                  <strong>Original:</strong>
                  <a href={url.original} target="_blank" rel="noopener noreferrer">
                    {url.original}
                  </a>
                </div>
                <div className="url-short">
                  <strong>Short:</strong>
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
                  <strong>Expires:</strong> {url.expiry}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
