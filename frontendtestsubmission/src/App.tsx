import { Log } from "./LoggingMiddleware/index";
import UrlShortenerPage from "./pages/UrlShortnerPage";
import "./App.css";

export default function App() {
  // Fire and forget logging - don't await to prevent blocking
  Log("frontend", "info", "component", "App component mounted").catch(console.warn);
  return (
    <div className="App" style={{ padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
        URL Shortener Application
      </h1>
      <UrlShortenerPage />
    </div>
  );
}
