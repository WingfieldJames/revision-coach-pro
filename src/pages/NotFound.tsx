import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Instagram } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center flex-1 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
          <Link to="/" className="text-primary hover:text-primary/80 underline">
            Return to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={20} />
            </a>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
          <div className="flex justify-center items-center gap-4">
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={24} />
            </a>
            <p className="text-sm text-muted-foreground">
              © A* AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
