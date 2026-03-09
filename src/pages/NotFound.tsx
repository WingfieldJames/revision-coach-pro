import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Instagram } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

const NotFound = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Page Not Found | A* AI"
        description="The page you're looking for doesn't exist. Return to A* AI homepage."
        canonical="https://astarai.co.uk/"
      />
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
      <footer className="py-16 px-8 text-center border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={currentLogo} alt="A* AI" className="h-12 sm:h-14" />
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={20} />
            </a>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="text-gradient-brand hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="text-gradient-brand hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="text-gradient-brand hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="text-gradient-brand hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
          <div className="flex justify-center items-center gap-4">
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={24} />
            </a>
            <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2025 A* AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
