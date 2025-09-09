import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
// import logo from '@/assets/logo.png';

interface HeaderProps {
  showNavLinks?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 pt-6 pb-4 bg-background text-foreground">
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-10" />
        </Link>
      </div>
      
      {showNavLinks && (
        <nav className="flex flex-wrap gap-2 md:gap-6 text-xs md:text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors whitespace-nowrap">Home</Link>
          <Link to="/compare#testimonials" className="hover:text-foreground transition-colors whitespace-nowrap">Testimonials</Link>
          <Link 
            to={user ? "/dashboard" : "/login"} 
            className="hover:text-foreground transition-colors whitespace-nowrap"
            onClick={() => !user && window.scrollTo(0, 0)}
          >
            Profile
          </Link>
        </nav>
      )}

      {user && (
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <span className="text-sm text-muted-foreground truncate max-w-[120px] md:max-w-none hidden sm:block">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      )}
    </header>
  );
};