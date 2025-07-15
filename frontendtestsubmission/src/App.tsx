import { useState } from "react";
import { Log } from "./LoggingMiddleware/index";
import UrlShortenerPage from "./pages/UrlShortnerPage";
import UrlStatisticsPage from "./pages/UrlStatisticsPage";
import "./App.css";

type UrlEntry = {
  id: string;
  original: string;
  short: string;
  expiry: string;
  createdAt: Date;
  status: 'pending' | 'success' | 'error';
  error?: string;
};

type Page = 'shortener' | 'statistics';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('shortener');
  const [urls, setUrls] = useState<UrlEntry[]>([]);

  Log("frontend", "info", "component", "App component mounted").catch(console.warn);

  return (
    <div className="App" style={{ padding: '20px', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <div className="app-header">
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
          URL Shortener Application
        </h1>
        
        <div className="navigation">
          <button 
            className={`nav-btn ${currentPage === 'shortener' ? 'active' : ''}`}
            onClick={() => setCurrentPage('shortener')}
          >
            URL Shortener
          </button>
          <button 
            className={`nav-btn ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('statistics')}
          >
            Statistics ({urls.length})
          </button>
        </div>
      </div>

      {/* Page Content */}
      {currentPage === 'shortener' ? (
        <UrlShortenerPage 
          urls={urls}
          setUrls={setUrls}
        />
      ) : (
        <UrlStatisticsPage urls={urls} />
      )}
    </div>
  );
}
