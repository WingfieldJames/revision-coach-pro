import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import sophiaImage from '@/assets/sophia-oxford.jpg';
import davidImage from '@/assets/david-cambridge.jpg';
import hannahImage from '@/assets/hannah-durham.jpg';
import amiraImage from '@/assets/amira-lse.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const ComparePage = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const shouldCheckout = searchParams.get('checkout') === 'true';

  // Scroll to top when component mounts, or to testimonials if hash is present
  useEffect(() => {
    if (window.location.hash === '#testimonials') {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        const testimonialsSection = document.getElementById('testimonials');
        if (testimonialsSection) {
          testimonialsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Auto-trigger checkout if redirected from login
  useEffect(() => {
    if (shouldCheckout && user && !profile?.is_premium) {
      console.log('Auto-triggering checkout for logged-in user');
      handlePremiumClick();
    }
  }, [shouldCheckout, user, profile?.is_premium]);

  const handleFreeClick = async () => {
    if (!user) {
      // NOT logged in → Login → Dashboard
      window.location.href = '/login?redirect=dashboard';
      return;
    }
    
    // LOGGED in (any user) → Free version
    window.location.href = '/free-version';
  };

  const handlePremiumClick = async () => {
    if (!user) {
      // NOT logged in → Login → Stripe
      window.location.href = '/login?redirect=stripe';
      return;
    }

    // Check if user is already premium
    if (profile?.is_premium) {
      // LOGGED in (paying user) → Profile dashboard
      window.location.href = '/dashboard';
      return;
    }

    // LOGGED in (standard user) → Stripe checkout
    try {
      console.log('Creating checkout session for standard user...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error('Session error:', sessionError);
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Checkout error:', error);
        alert(`Failed to create checkout session: ${error.message || error}`);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No checkout URL in response:', data);
        alert('Unable to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in handlePremiumClick:', error);
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header showNavLinks />
      
      <main className="py-8 px-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your A* AI Plan</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Unlock your full revision power. Go beyond free.
        </p>

        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Free Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left">
            <h2 className="text-2xl font-semibold mb-6">🎓 Free Plan</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                2 years of past papers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Basic GPT responses
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Spec-aligned questions
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              onClick={handleFreeClick}
            >
              Use Free Version
            </Button>
          </div>

          {/* Deluxe Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left border-2 border-primary">
            <h2 className="text-2xl font-semibold mb-6">🔥 Deluxe Plan — £19.99 (One-Time, Lifetime Access)</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                All Edexcel A-Level Economics A past papers (Paper 1, 2 & 3, 2017–2023)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Official examiner mark schemes
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Trained on full exam technique + essay structures
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Complete specification coverage
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Step-by-step diagram guidance (every diagram from AD/AS to buffer stocks)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Application + model essay examples
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              onClick={handlePremiumClick}
            >
              Unlock Deluxe
            </Button>
          </div>
        </div>
      </main>
      
      <section id="testimonials" className="py-16 md:py-20 bg-muted w-full mt-12 md:mt-20">
        <div className="px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl text-center mb-12 flex items-center justify-center gap-2">
            Loved by sixth formers across the UK ⬇️
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={sophiaImage} alt="Sophia profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">Sophia – Economics & Management, Oxford</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "I used A* AI daily before my mocks — especially for Paper 3. The real-world examples and structure help made it easier to hit those top evaluation marks."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={davidImage} alt="David profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">David – Economics, Cambridge</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "A* AI understood the mark schemes better than my tutor. It explained diagrams perfectly and helped me plan 25-markers like an examiner would expect."
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={hannahImage} alt="Hannah profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">Hannah – Economics, Durham</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "No fluff, no wasted time — A* AI helped me revise with focus. Being able to search by topic and command word made past paper practice 10x more efficient."
                </p>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={amiraImage} alt="Amira profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">Amira – LSE Offer Holder</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <div className="px-8 max-w-4xl mx-auto mt-12 mb-12">
          <div className="p-6 bg-secondary rounded-lg">
            <p className="text-muted-foreground mb-4 text-center">
              New to A* AI? Create an account to track your progress and access premium features.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button variant="brand" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};