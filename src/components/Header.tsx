import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

interface HeaderProps {
  showNavLinks?: boolean;
  showBackButton?: boolean;
  backUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false, 
  showBackButton = false, 
  backUrl = '/' 
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
    <header className="flex justify-between items-center p-6">
      <div className="flex items-center">
        {showBackButton ? (
          <Button variant="back" size="sm" asChild>
            <Link to={backUrl}>← Back to Home</Link>
          </Button>
        ) : (
          <Link to="/" className="flex items-center">
            <img src={logo} alt="A* AI logo" className="h-10" />
          </Link>
        )}
      </div>
      
      {showNavLinks && (
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <span>Menu</span>
          <span>Testimonials</span>
          <span>Our Story</span>
          {user && (
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              My Profile
            </Link>
          )}
        </nav>
      )}

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      )}
    </header>
  );
};