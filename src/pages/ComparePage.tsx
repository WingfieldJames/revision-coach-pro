import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const ComparePage = () => {
  const { user, profile } = useAuth();

  const handlePremiumClick = async () => {
    console.log('Premium button clicked, user:', user, 'profile:', profile);
    
    if (!user) {
      // Redirect to signup if not authenticated
      window.location.href = '/signup';
      return;
    }

    // Check if user is already premium
    if (profile?.is_premium) {
      console.log('User is already premium, redirecting to premium chatbot');
      window.location.href = '/premium';
      return;
    }

    // User is logged in but not premium, proceed to Stripe
    try {
      console.log('Invoking create-checkout function with user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      console.log('Create checkout response:', { data, error });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        alert(`Failed to create checkout session: ${error.message}`);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('No checkout URL received');
        alert('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Failed to create checkout session: ${error}`);
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
              onClick={() => {
                if (!user) {
                  window.location.href = '/signup';
                } else {
                  window.location.href = '/free-version';
                }
              }}
            >
              Use Free Version
            </Button>
          </div>

          {/* Deluxe Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left border-2 border-primary">
            <h2 className="text-2xl font-semibold mb-6">🔥 Deluxe Plan – £19.99</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                10+ years of past papers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Official mark schemes
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Built-in exam technique
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Application and essay examples
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Full Notion study guide
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

        {/* Testimonials Section */}
        <section className="py-20 bg-muted -mx-8">
          <div className="px-8">
            <h2 className="text-3xl text-center mb-12 flex items-center justify-center gap-2">
              Loved by sixth formers across the UK ⬇️
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-card p-8 rounded-2xl shadow-card flex gap-6 w-full">
                <img src="oxford1.jpg" alt="Sophia profile" className="w-18 h-18 rounded-full object-cover flex-shrink-0" />
                <div>
                  <strong className="text-lg text-card-foreground">Sophia – Economics & Management, Oxford</strong>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    "I used A* AI daily before my mocks — especially for Paper 3. The real-world examples and structure help made it easier to hit those top evaluation marks."
                  </p>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-card p-8 rounded-2xl shadow-card flex gap-6 w-full">
                <img src="cambridge1.jpg" alt="David profile" className="w-18 h-18 rounded-full object-cover flex-shrink-0" />
                <div>
                  <strong className="text-lg text-card-foreground">David – Economics, Cambridge</strong>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    "A* AI understood the mark schemes better than my tutor. It explained diagrams perfectly and helped me plan 25-markers like an examiner would expect."
                  </p>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-card p-8 rounded-2xl shadow-card flex gap-6 w-full">
                <img src="durham1.jpg" alt="Hannah profile" className="w-18 h-18 rounded-full object-cover flex-shrink-0" />
                <div>
                  <strong className="text-lg text-card-foreground">Hannah – Economics, Durham</strong>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    "No fluff, no wasted time — A* AI helped me revise with focus. Being able to search by topic and command word made past paper practice 10x more efficient."
                  </p>
                </div>
              </div>

              {/* Testimonial 4 */}
              <div className="bg-card p-8 rounded-2xl shadow-card flex gap-6 w-full">
                <img src="lse1.jpg" alt="Amira profile" className="w-18 h-18 rounded-full object-cover flex-shrink-0" />
                <div>
                  <strong className="text-lg text-card-foreground">Amira – LSE Offer Holder</strong>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    "I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!user && (
          <div className="mt-12 p-6 bg-secondary rounded-lg">
            <p className="text-muted-foreground mb-4">
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
        )}
      </main>
    </div>
  );
};