import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { apiService } from '@/utils/api';
import { TOAST_REMOVE_DELAY } from '@/hooks/use-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const credentials = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await apiService.request<{ user: any; token: string }>(
        isLogin ? '/auth/login' : '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      if (response.user && response.token) {
        await authLogin(credentials.email, credentials.password);
        toast({
          title: isLogin ? 'Login successful!' : 'Account created successfully!',
          description: `Welcome ${response.user.name || response.user.email}!`,
          variant: 'success',
          icon: <CheckCircle className="h-5 w-5 text-[hsl(var(--success-foreground))]" />
        });
        
        navigate(from, { replace: true });
      } else {
        throw new Error('Authentication failed: Invalid response from server');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  interface GoogleAuthResponse {
    token: string;
    user: {
      email: string;
      name?: string;
      id: string;
    };
    status?: number;
  }

  const handleGoogleSuccess = async (credentialResponse: { code?: string }) => {
    if (!credentialResponse.code) {
      toast({
        title: 'Authentication Error',
        description: 'Failed to get authorization code from Google.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.request<GoogleAuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          code: credentialResponse.code,
        }),
      });

      if (response.token && response.user) {
        // Store the token and user data in session storage
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response.user));

        // Update auth context with token
        if (authLogin) {
          await authLogin(response.user.email, response.token);
        }

        const isNewUser = response.status === 201;
        
        toast({
          title: isNewUser ? 'Welcome!' : 'Login successful!',
          description: isNewUser 
            ? `Welcome ${response.user.name || response.user.email}!`
            : `Welcome back ${response.user.name || response.user.email}!`,
          variant: 'success',
          icon: <CheckCircle className="h-5 w-5 text-[hsl(var(--success-foreground))]" />
        });

        navigate(isNewUser ? '/onboarding' : from, { replace: true });
      } else {
        throw new Error('Authentication failed: Invalid response from server');
      }
    } catch (error: unknown) {
      // Type guard to check if error has a response property
      const hasResponse = (err: any): err is { response: { status: number; data?: any } } => {
        return err && typeof err === 'object' && 'response' in err;
      };

      // Type guard to check if error is an Error object
      const isError = (err: unknown): err is Error => {
        return err instanceof Error;
      };

      let errorMessage = 'Something went wrong. Please try again.';
      let errorTitle = 'Authentication Error';
      let showLoginButton = false;

      if (hasResponse(error)) {
        const errorData = error.response?.data || {};
        
        if (error.response.status === 409) {
          errorTitle = 'Account Exists';
          
          if (errorData.code === 'EMAIL_ALREADY_EXISTS_NON_GOOGLE') {
            errorMessage = 'An account with this email already exists. Please sign in using your password, or link your Google account in your profile settings.';
            showLoginButton = true;
          } else {
            errorMessage = errorData.message || 'An account with this email already exists.';
          }
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } else if (isError(error)) {
        errorMessage = error.message;
      }

      if (showLoginButton) {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              onClick={() => setIsLogin(true)}
              className="ml-2"
            >
              Go to Login
            </Button>
          )
        });
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (errorResponse: any) => {
    console.error('Google login error:', errorResponse);
    let errorMessage = 'Could not log in with Google. Please try again.';
    
    if (errorResponse.error === 'popup_closed_by_user') {
      errorMessage = 'Google sign in was canceled.';
    } else if (errorResponse.error) {
      errorMessage = `Google sign in error: ${errorResponse.error}`;
    }
    
    toast({
      title: 'Google Login Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const googleAuth = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    flow: 'auth-code',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 radial-glow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-slate-900 dark:text-white"
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </motion.h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? 'Sign in to continue' : 'Start your journey with us'}
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-6 glass p-8 rounded-2xl shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-black hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-200 dark:hover:to-slate-400 transition-colors duration-200 rounded-xl py-2"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <div className="relative flex justify-center text-xs uppercase my-6">
            <span className="bg-white dark:bg-black px-2 text-muted-foreground z-10">
              Or continue with
            </span>
            <div className="absolute inset-y-0 left-0 w-full flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Button
              onClick={() => { googleAuth(); setIsLoading(true); }}
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 px-6 border-2 border-slate-300 dark:border-slate-600 rounded-full shadow-lg text-base font-semibold transition-all duration-300
                bg-white dark:bg-slate-800
                text-slate-800 dark:text-white
                hover:bg-slate-100 dark:hover:bg-slate-700
                focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-500
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
