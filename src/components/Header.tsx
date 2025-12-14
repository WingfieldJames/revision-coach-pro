import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, ITab } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ImageUploadTool } from '@/components/ImageUploadTool';
import { DiagramFinderTool } from '@/components/DiagramFinderTool';
import { EssayMarkerTool } from '@/components/EssayMarkerTool';
import { Camera, BarChart2, PenLine, Lock } from 'lucide-react';

interface HeaderProps {
  showNavLinks?: boolean;
  showImageTool?: boolean;
  showDiagramTool?: boolean;
  showEssayMarker?: boolean;
  toolsLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false,
  showImageTool = false,
  showDiagramTool = false,
  showEssayMarker = false,
  toolsLocked = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [imageToolOpen, setImageToolOpen] = useState(false);
  const [diagramToolOpen, setDiagramToolOpen] = useState(false);
  const [essayMarkerOpen, setEssayMarkerOpen] = useState(false);

  const LockedToolContent = () => (
    <div className="text-center py-6 px-4">
      <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <h3 className="font-semibold text-lg mb-2">Deluxe Feature</h3>
      <p className="text-muted-foreground text-sm mb-4">
        To access this feature, you need to upgrade to the Deluxe plan.
      </p>
      <Button 
        variant="brand" 
        size="sm"
        onClick={() => {
          setImageToolOpen(false);
          setDiagramToolOpen(false);
          setEssayMarkerOpen(false);
          navigate('/compare');
        }}
      >
        Upgrade to Deluxe
      </Button>
    </div>
  );

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
    { title: "Launch", value: "profile" }
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
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        navigate('/login');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
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
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-8 sm:h-10" />
        </Link>
        
        {showImageTool && (
          <Popover open={imageToolOpen} onOpenChange={setImageToolOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Image to Text</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-0 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
              onPointerDownOutside={(e) => {
                // Prevent closing when clicking outside (e.g., file dialog)
                e.preventDefault();
              }}
              onInteractOutside={(e) => {
                // Prevent closing on any interaction outside
                e.preventDefault();
              }}
            >
              <div className="p-4">
                {toolsLocked ? <LockedToolContent /> : <ImageUploadTool />}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {showDiagramTool && (
          <Popover open={diagramToolOpen} onOpenChange={setDiagramToolOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Diagram Generator</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-0 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <div className="p-4">
                {toolsLocked ? <LockedToolContent /> : <DiagramFinderTool />}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showEssayMarker && (
          <Popover open={essayMarkerOpen} onOpenChange={setEssayMarkerOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">Essay Marker</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-0 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <div className="p-4">
                {toolsLocked ? <LockedToolContent /> : <EssayMarkerTool />}
              </div>
            </PopoverContent>
          </Popover>
        )}
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
