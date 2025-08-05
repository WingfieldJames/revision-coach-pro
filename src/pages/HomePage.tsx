import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import logo from '@/assets/logo.png';
// import phone from '@/assets/phone.png';
import laptop from '@/assets/laptop.png';
import tillyTaylor from '@/assets/tilly-taylor.png';
import elliotSmith from '@/assets/elliot-smith.png';
import revishann from '@/assets/revishann.png';

export const HomePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect premium users to deluxe chatbot iframe
  useEffect(() => {
    if (user && profile?.is_premium) {
      navigate('/premium');
    } else if (user && profile && !profile.is_premium) {
      // If user is logged in but not premium, redirect to free version
      navigate('/free-version');
    }
  }, [user, profile, navigate]);
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header showNavLinks />
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between p-8 gap-8">
        <div className="flex-1 max-w-2xl">
          <div className="bg-secondary text-foreground text-sm px-4 py-2 rounded-full inline-block mb-6">
            ⭐ Loved by 50+ users with a 4.9 star rating
          </div>
          
          <h1 className="text-5xl font-bold mb-4 flex items-center gap-3">
            Meet <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-12" />
          </h1>
          
          <h2 className="text-3xl font-medium mb-6 text-foreground">
            Your AI-powered A-Level revision coach
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            A* AI is the smartest way to revise for Edexcel Economics. Get real past paper 
            questions, official mark schemes, live feedback and top-grade technique — all in one place.
          </p>
        </div>

        <div className="flex-1 text-center">
          <img src="/lovable-uploads/92ff8122-110e-4b97-8135-37b4607f3798.png" alt="A* AI on mobile" className="max-w-full h-auto mx-auto" />
          <Button variant="brand" size="xl" asChild className="mt-6">
            <Link to="/compare">Try It Now →</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-8 text-center bg-muted">
        <h2 className="text-3xl font-bold mb-8">
          Used by your favourite study influencers & top students 👀
        </h2>
        
        <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src={tillyTaylor} alt="Tilly Taylor" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Tilly Taylor</strong><br />
              <span className="text-sm text-muted-foreground">BSc Economics, LSE</span>
            </div>
          </div>

          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src={elliotSmith} alt="Elliot Smith" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Elliot Smith</strong><br />
              <span className="text-sm text-muted-foreground">BSc Finance, LSE</span>
            </div>
          </div>

          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src={revishann} alt="Revishann" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Revishann</strong><br />
              <span className="text-sm text-muted-foreground">A* Student & A-Level Mentor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2">
          How <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" /> helps you revise{' '}
          <span className="bg-gradient-brand bg-clip-text text-transparent">smarter</span>
        </h2>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
          {/* Laptop Image */}
          <div className="flex-1 text-center">
            <img src={laptop} alt="Laptop mockup" className="max-w-full h-auto rounded-xl shadow-elevated mx-auto" />
            <Button variant="brand" size="xl" asChild className="mt-8">
              <Link to="/compare">Try A* AI Now →</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📄 Past Paper Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Search and retrieve real past paper questions by topic, paper, or command word. 
                A* AI understands how Edexcel organises questions, making practice fully targeted.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📰 Live Updated Application</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                The latest examples and case studies — formatted specifically for 25-mark essays 
                in Paper 1 and 2. Updated regularly from global economic news to match Edexcel expectations.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📊 Diagram Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Every key diagram — from negative externalities to subsidies, tariffs to buffer stocks — 
                is built-in and explained so you can deploy it mid-essay with precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <span className="text-xl font-semibold">A* AI</span>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          {!user && (
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="brand" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};