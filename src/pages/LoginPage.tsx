import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const isDark = theme === 'dark';
  const { toast } = useToast();

  const redirect = searchParams.get('redirect');

  // Theme-aware canvas colors
  const canvasColors: [number, number, number][] = isDark
    ? [[255, 154, 46], [255, 77, 141]]
    : [[147, 51, 234], [124, 58, 237]];

  // Theme-aware gradient for submit button
  const submitGradient = isDark
    ? 'linear-gradient(135deg, #FFC83D 0%, #FF9A2E 30%, #FF6A3D 60%, #FF4D8D 100%)'
    : 'linear-gradient(135deg, #9333EA 0%, #7C3AED 30%, #6D28D9 60%, #A855F7 100%)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: "Success",
        description: "You've been logged in successfully!",
      });

      if (redirect === 'stripe') {
        navigate('/compare?checkout=true');
      } else if (redirect) {
        // Redirect to the original path the user was trying to access
        navigate(`/${redirect}`);
      } else {
        navigate('/compare');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      toast({
        title: "Success",
        description: "Password reset email sent! Check your inbox.",
      });
      setResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
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

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <SEOHead 
        title="Sign In to A* AI | A-Level Economics Revision"
        description="Sign in to your A* AI account to access your AI-powered A-Level Economics revision coach. Continue your journey to an A*."
        canonical="https://astarai.co.uk/login"
      />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-background">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-background"
          colors={canvasColors}
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
            <img src={currentLogo} alt="A* AI" className="h-12 sm:h-14" />
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
              <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back</h1>
              <p className="text-muted-foreground">Sign in to your A* AI account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-foreground/5 backdrop-blur-sm border border-foreground/10 rounded-full py-3 px-4 text-foreground hover:bg-foreground/10 transition-all duration-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-foreground/10" />
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
                  className="w-full backdrop-blur-sm text-foreground bg-foreground/5 border border-foreground/10 rounded-full py-3 px-4 focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full backdrop-blur-sm text-foreground bg-foreground/5 border border-foreground/10 rounded-full py-3 px-4 focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="brand"
                        className="w-full rounded-full" 
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`w-full rounded-full py-3 px-4 font-medium transition-all duration-300 ${
                  email && password
                    ? "text-white cursor-pointer glow-brand hover:glow-brand-intense hover:-translate-y-0.5"
                    : "bg-foreground/5 text-muted-foreground border border-foreground/10 cursor-not-allowed"
                }`}
                style={email && password ? { background: submitGradient } : undefined}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Don't have an account?{' '}
                <Link 
                  to={`/signup${redirect ? `?redirect=${redirect}` : ''}`}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Create one here
                </Link>
              </p>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground/60 text-xs">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
