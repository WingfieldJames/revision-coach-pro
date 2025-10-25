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
    if (location.hash === '#testimonials') return 'testimonials';
    return 'home';
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getSelectedTab());

  // Update selected tab when location changes
  React.useEffect(() => {
    setSelectedTab(getSelectedTab());
  }, [location.pathname, location.hash]);

  const tabs: ITab[] = [
    { title: "Home", value: "home" },
    { title: "Testimonials", value: "testimonials" },
    { title: "Profile", value: "profile" }
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    if (value === "home") {
      if (location.pathname !== '/') {
        navigate('/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (value === "testimonials") {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: 'testimonials' } });
      } else {
        const testimonialsSection = document.querySelector('[data-section="testimonials"]');
        testimonialsSection?.scrollIntoView({ behavior: 'smooth' });
      }
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
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 pt-6 pb-2 bg-background text-foreground">
      <div className="flex items-center">
        <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-10" />
        </Link>
      </div>
      
      {showNavLinks && (
        <div className="flex-1 flex justify-center">
          <Tabs 
            selected={selectedTab} 
            setSelected={handleTabChange} 
            tabs={tabs} 
            variant="primary"
          />
        </div>
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