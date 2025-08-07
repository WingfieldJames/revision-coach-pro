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
    <header className="flex justify-between items-center p-6">
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-10" />
        </Link>
      </div>
      
      {showNavLinks && (
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>Testimonials</span>
          <span>Our Story</span>
          <Link 
            to={user ? "/dashboard" : "/login"} 
            className="hover:text-foreground transition-colors"
          >
            My Profile
          </Link>
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