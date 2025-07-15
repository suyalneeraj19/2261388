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

type UrlInput = {
  longUrl: string;
  validity: string;
  shortcode: string;
};

type Props = {
  urls: UrlEntry[];
  setUrls: React.Dispatch<React.SetStateAction<UrlEntry[]>>;
};

export default function UrlShortenerPage({ urls, setUrls }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<UrlInput[]>([
    { longUrl: "", validity: "", shortcode: "" }
  ]);

  const addUrlInput = useCallback(() => {
    if (urlInputs.length < 5) {
      setUrlInputs(prev => [...prev, { longUrl: "", validity: "", shortcode: "" }]);
    }
  }, [urlInputs.length]);

  const removeUrlInput = useCallback((index: number) => {
    if (urlInputs.length > 1) {
      setUrlInputs(prev => prev.filter((_, i) => i !== index));
    }
  }, [urlInputs.length]);

  const updateUrlInput = useCallback((index: number, field: keyof UrlInput, value: string) => {
    setUrlInputs(prev => prev.map((input, i) => 
      i === index ? { ...input, [field]: value } : input
    ));
  }, []);

  const validateUrlInputs = useCallback((inputs: UrlInput[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if at least one URL is provided
    const hasValidInputs = inputs.some(input => input.longUrl.trim() !== "");
    if (!hasValidInputs) {
      errors.push("At least one URL must be provided");
    }

    inputs.forEach((input, index) => {
      if (input.longUrl.trim() !== "") {
        // Validate URL format
        const urlRegex = /^https?:\/\/.+\..+/;
        if (!urlRegex.test(input.longUrl)) {
          errors.push(`URL ${index + 1}: Invalid URL format. Must start with http:// or https://`);
        }

        // Validate validity period
        if (input.validity && input.validity.trim() !== "") {
          const validity = parseInt(input.validity);
          if (isNaN(validity) || validity < 1 || validity > 1440) {
            errors.push(`URL ${index + 1}: Validity must be between 1 and 1440 minutes`);
          }
        }

        // Validate shortcode
        if (input.shortcode && input.shortcode.trim() !== "") {
          const shortcodeRegex = /^[a-zA-Z0-9]{1,10}$/;
          if (!shortcodeRegex.test(input.shortcode)) {
            errors.push(`URL ${index + 1}: Shortcode must be 1-10 alphanumeric characters`);
          }
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }, []);

  const handleShortenAll = useCallback(async () => {
    const validation = validateUrlInputs(urlInputs);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Filter out empty inputs
    const validInputs = urlInputs.filter(input => input.longUrl.trim() !== "");
    
    // Create pending entries
    const pendingEntries: UrlEntry[] = validInputs.map((input, index) => ({
      id: `pending-${Date.now()}-${index}`,
      original: input.longUrl,
      short: "",
      expiry: "",
      createdAt: new Date(),
      status: 'pending' as const
    }));

    setUrls(prev => [...pendingEntries, ...prev]);

    // Process each URL concurrently
    const promises = validInputs.map(async (input, index) => {
      try {
        const validity = input.validity.trim() === "" ? 30 : parseInt(input.validity);
        
        console.log(`Making API call for URL ${index + 1}:`, input.longUrl);
        
        const res = await fetch("http://20.244.56.144/evaluation-service/shorten", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzdXlhbG5lZXJhajA5QGdtYWlsLmNvbSIsImV4cCI6MTc1MjU1ODkyMSwiaWF0IjoxNzUyNTU4MDIxLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiODM1ZjI2MzAtOTgzYy00MzZkLWFhOTUtODFjNTQ5MGU4YjRhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibmVlcmFqIHN1eWFsIiwic3ViIjoiY2NhODFjYzEtNGVkMi00NmIyLTg2YjgtMThmZDIyZTdmNzIwIn0sImVtYWlsIjoic3V5YWxuZWVyYWowOUBnbWFpbC5jb20iLCJuYW1lIjoibmVlcmFqIHN1eWFsIiwicm9sbE5vIjoiMjI2MTM4OCIsImFjY2Vzc0NvZGUiOiJRQWhEVXIiLCJjbGllbnRJRCI6ImNjYTgxY2MxLTRlZDItNDZiMi04NmI4LTE4ZmQyMmU3ZjcyMCIsImNsaWVudFNlY3JldCI6IlVxcktXTU1BWlltZHNZZU0ifQ.yby4qf8rwXLQZLNouqqVZotldELCLUMs6nh7CjbwKL8"
          },
          body: JSON.stringify({ 
            longUrl: input.longUrl, 
            validity, 
            shortcode: input.shortcode || undefined
          }),
        });
        
        console.log(`Response status for URL ${index + 1}:`, res.status);
        console.log(`Response headers for URL ${index + 1}:`, res.headers);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error for URL ${index + 1}:`, res.status, errorText);
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        
        const data = await res.json();
        console.log(`Success response for URL ${index + 1}:`, data);
        Log("frontend", "info", "api", `URL ${index + 1} shortened successfully`).catch(console.warn);

        return {
          id: `success-${Date.now()}-${index}`,
          original: input.longUrl,
          short: data.shortUrl,
          expiry: data.expiry,
          createdAt: new Date(),
          status: 'success' as const
        };
      } catch (e) {
        console.error(`Error processing URL ${index + 1}:`, e);
        const errorMessage = e instanceof Error ? e.message : "Failed to shorten URL";
        Log("frontend", "error", "api", `Failed to shorten URL ${index + 1}: ${errorMessage}`).catch(console.warn);
        
        return {
          id: `error-${Date.now()}-${index}`,
          original: input.longUrl,
          short: "",
          expiry: "",
          createdAt: new Date(),
          status: 'error' as const,
          error: errorMessage
        };
      }
    });

    try {
      const results = await Promise.all(promises);
      
      // Update URLs with results
      setUrls(prev => {
        const filtered = prev.filter(url => !url.id.startsWith('pending-'));
        return [...results, ...filtered];
      });

      // Clear form if all successful
      const allSuccessful = results.every(result => result.status === 'success');
      if (allSuccessful) {
        setUrlInputs([{ longUrl: "", validity: "", shortcode: "" }]);
      }
    } catch (e) {
      setError("Failed to process URLs");
    } finally {
      setIsLoading(false);
    }
  }, [urlInputs, validateUrlInputs, setUrls]);

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      Log("frontend", "info", "component", "URL copied to clipboard").catch(console.warn);
    } catch (e) {
      Log("frontend", "error", "component", "Failed to copy URL to clipboard").catch(console.warn);
    }
  }, []);

  const handleUrlClick = useCallback((originalUrl: string, shortUrl: string) => {
    // Open the short URL
    window.open(shortUrl, '_blank');
  }, []);

  const testApiConnection = useCallback(async () => {
    try {
      console.log("Testing API connection...");
      const res = await fetch("http://20.244.56.144/evaluation-service/shorten", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzdXlhbG5lZXJhajA5QGdtYWlsLmNvbSIsImV4cCI6MTc1MjU1ODkyMSwiaWF0IjoxNzUyNTU4MDIxLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiODM1ZjI2MzAtOTgzYy00MzZkLWFhOTUtODFjNTQ5MGU4YjRhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibmVlcmFqIHN1eWFsIiwic3ViIjoiY2NhODFjYzEtNGVkMi00NmIyLTg2YjgtMThmZDIyZTdmNzIwIn0sImVtYWlsIjoic3V5YWxuZWVyYWowOUBnbWFpbC5jb20iLCJuYW1lIjoibmVlcmFqIHN1eWFsIiwicm9sbE5vIjoiMjI2MTM4OCIsImFjY2Vzc0NvZGUiOiJRQWhEVXIiLCJjbGllbnRJRCI6ImNjYTgxY2MxLTRlZDItNDZiMi04NmI4LTE4ZmQyMmU3ZjcyMCIsImNsaWVudFNlY3JldCI6IlVxcktXTU1BWlltZHNZZU0ifQ.yby4qf8rwXLQZLNouqqVZotldELCLUMs6nh7CjbwKL8"
        },
        body: JSON.stringify({ 
          longUrl: "https://www.google.com", 
          validity: 30
        }),
      });
      
      console.log("Test response status:", res.status);
      console.log("Test response headers:", res.headers);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Test API error:", res.status, errorText);
        alert(`API Test Failed: ${res.status} - ${errorText}`);
      } else {
        const data = await res.json();
        console.log("Test API success:", data);
        alert("API Test Successful! Check console for details.");
      }
    } catch (e) {
      console.error("Test API connection error:", e);
      alert(`API Test Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, []);

  const sortedUrls = useMemo(() => {
    return [...urls].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [urls]);

  return (
    <div className="url-shortener-page">
      <h1>URL Shortener</h1>
      
      <div className="url-inputs-container">
        <div className="url-inputs-header">
          <h2>Enter URLs to Shorten (Up to 5)</h2>
          <div className="header-buttons">
            {urlInputs.length < 5 && (
              <button onClick={addUrlInput} className="add-url-btn">
                + Add Another URL
              </button>
            )}
            <button onClick={testApiConnection} className="test-api-btn">
              Test API Connection
            </button>
          </div>
        </div>
        
        {urlInputs.map((input, index) => (
          <div key={index} className="url-input-group">
            <div className="url-input-header">
              <h3>URL {index + 1}</h3>
              {urlInputs.length > 1 && (
                <button 
                  onClick={() => removeUrlInput(index)}
                  className="remove-url-btn"
                  title="Remove this URL"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="url-input-fields">
              <div className="form-group">
                <input
                  name="longUrl"
                  placeholder="Enter long URL"
                  value={input.longUrl}
                  onChange={(e) => updateUrlInput(index, 'longUrl', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <input
                  name="validity"
                  placeholder="Validity (minutes, default: 30)"
                  value={input.validity}
                  onChange={(e) => updateUrlInput(index, 'validity', e.target.value)}
                  disabled={isLoading}
                  type="number"
                  min="1"
                  max="1440"
                />
              </div>
              
              <div className="form-group">
                <input
                  name="shortcode"
                  placeholder="Custom shortcode (optional)"
                  value={input.shortcode}
                  onChange={(e) => updateUrlInput(index, 'shortcode', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={handleShortenAll} 
          disabled={isLoading || urlInputs.every(input => input.longUrl.trim() === "")}
          className="submit-all-btn"
        >
          {isLoading ? "Shortening..." : `Shorten ${urlInputs.filter(input => input.longUrl.trim() !== "").length} URL(s)`}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {sortedUrls.length > 0 && (
        <div className="urls-list">
          <h2>Recent URLs</h2>
          {sortedUrls.map((url) => (
            <div key={url.id} className={`url-item ${url.status}`}>
              <div className="url-content">
                <div className="url-original">
                  <strong>Original:</strong>
                  <a href={url.original} target="_blank" rel="noopener noreferrer">
                    {url.original}
                  </a>
                </div>
                
                {url.status === 'pending' && (
                  <div className="url-status pending">
                    <strong>Status:</strong> Processing...
                  </div>
                )}
                
                {url.status === 'success' && (
                  <>
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
                  </>
                )}
                
                {url.status === 'error' && (
                  <div className="url-status error">
                    <strong>Error:</strong> {url.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
