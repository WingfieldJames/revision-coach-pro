import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, ITab } from '@/components/ui/tabs';
// import logo from '@/assets/logo.png';

interface HeaderProps {
  showNavLinks?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine selected tab based on current route
  const getSelectedTab = () => {
    if (location.pathname === '/dashboard') return 'profile';
    if (location.pathname === '/login') return 'profile';
    if (location.pathname === '/compare') return 'pricing';
    return 'home';
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getSelectedTab());

  // Update selected tab when location changes
  React.useEffect(() => {
    const newTab = getSelectedTab();
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
    }
  }, [location.pathname]);

  const tabs: ITab[] = [
    { title: "Home", value: "home" },
    { title: "Pricing", value: "pricing" },
    { title: "Profile", value: "profile" }
  ];

  const handleTabChange = (value: string) => {
    if (value === "home") {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else if (value === "pricing") {
      navigate('/compare');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else if (value === "profile") {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-3 sm:px-6 pt-4 sm:pt-6 pb-2 bg-background text-foreground">
      <div className="flex items-center flex-shrink-0">
        <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-8 sm:h-10" />
        </Link>
      </div>
      
      {showNavLinks && (
        <div className="flex-1 flex justify-center px-2 min-w-0">
          <Tabs 
            selected={selectedTab} 
            setSelected={handleTabChange} 
            tabs={tabs} 
            variant="primary"
          />
        </div>
      )}

      {user && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[80px] sm:max-w-[120px] md:max-w-none hidden sm:block">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-3">
            Sign Out
          </Button>
        </div>
      )}
    </header>
  );
};