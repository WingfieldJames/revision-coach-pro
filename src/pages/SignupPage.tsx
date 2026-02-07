import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';
import logoImg from '@/assets/logo.png';

export const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });

      // Handle different redirect scenarios
      if (redirect === 'stripe') {
        navigate('/compare?checkout=true');
      } else if (redirect === 'premium') {
        navigate('/premium-version');
      } else if (redirect === 'free-version') {
        navigate('/free-version');
      } else {
        navigate('/compare');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Redirecting to Google sign-in...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const isFormValid = email && password && confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <SEOHead 
        title="Create Account | A* AI – A-Level Economics Revision"
        description="Join 1000+ students using A* AI to master A-Level Economics. Create your free account and start revising with AI trained on real past papers."
        canonical="https://astarai.co.uk/signup"
      />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-background">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-background"
          colors={[[255, 154, 46], [255, 77, 141]]}
          opacities={[0.05, 0.05, 0.08, 0.08, 0.1, 0.1, 0.12, 0.15, 0.15, 0.2]}
          dotSize={3}
          showGradient={false}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top navigation */}
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoImg} alt="A* AI" className="h-12 sm:h-14" />
          </Link>
        </div>

        {/* Main content container */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join A* AI and start your revision journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full py-3 px-4 text-foreground hover:bg-white/10 transition-all duration-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full backdrop-blur-sm text-foreground bg-white/5 border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full backdrop-blur-sm text-foreground bg-white/5 border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full backdrop-blur-sm text-foreground bg-white/5 border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full rounded-full py-3 px-4 font-medium transition-all duration-300 ${
                  isFormValid
                    ? "text-white cursor-pointer glow-brand hover:glow-brand-intense hover:-translate-y-0.5"
                    : "bg-white/5 text-muted-foreground border border-white/10 cursor-not-allowed"
                }`}
                style={isFormValid ? { background: 'linear-gradient(135deg, #FFC83D 0%, #FF9A2E 30%, #FF6A3D 60%, #FF4D8D 100%)' } : undefined}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {/* Sign in link */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link 
                  to={`/login${redirect ? `?redirect=${redirect}` : ''}`}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground/60 text-xs">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
