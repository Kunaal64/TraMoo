import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin, CredentialResponse, useGoogleLogin, TokenResponse } from '@react-oauth/google';
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
  const { login: authLogin, googleLogin } = useAuth();

  const from = location.state?.from?.pathname || '/';

  interface GoogleAuthResponse {
    token: string;
    user: {
      email: string;
      name?: string;
      id: string;
    };
    status?: number;
  }

  const handleGoogleSuccess = async (codeResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    console.log('Google auth code response:', codeResponse);
    
    if (!codeResponse.code) {
      toast({
        title: 'Authentication Error',
        description: 'Failed to get authorization code from Google. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send the Google authorization code to our backend for verification
      const response = await apiService.request<GoogleAuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          code: codeResponse.code,
        })
      });
      
      if (response.user && response.token) {
        // Use the googleLogin function from AuthContext
        googleLogin({ user: response.user, token: response.token });
        
        toast({
          title: 'Success!',
          description: 'Successfully signed in with Google',
          variant: 'success',
        });
        
        navigate(from, { replace: true });
      } else {
        throw new Error('Authentication failed: Invalid response from server');
      }
    } catch (error: unknown) {
      console.error('Google authentication error:', error);
      
      // Type guard to check if error has a response property
      const hasResponse = (err: any): err is { response: { status: number; data?: any } } => {
        return err && typeof err === 'object' && 'response' in err;
      };

      // Type guard to check if error is an Error object
      const isError = (err: unknown): err is Error => {
        return err instanceof Error;
      };

      let errorMessage = 'Failed to sign in with Google. Please try again.';
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

  const handleGoogleError = (errorResponse: { error?: string; error_description?: string }) => {
    console.error('Google login error:', errorResponse);
    let errorMessage = 'Could not log in with Google. Please try again.';

    if (errorResponse.error === 'popup_closed_by_user') {
      errorMessage = 'Google login window was closed. Please try again.';
    } else if (errorResponse.error === 'access_denied') {
      errorMessage = 'Access denied by Google.';
    } else if (errorResponse.error_description) {
      errorMessage = errorResponse.error_description;
    }

    toast({
      title: 'Google Login Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (errorResponse) => handleGoogleError(errorResponse as { error?: string; error_description?: string }),
    flow: 'auth-code',
  });

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
      console.log('Full error object from backend:', error.response?.data);
      // Extract more specific error messages from the backend
      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors.map((err: any) => err.msg).join('; ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

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

          <div className="text-center">
            <div className="w-full flex justify-center">
              <Button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-black hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-200 dark:hover:to-slate-400 transition-colors duration-200 rounded-xl py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.675 12.001c0-.783-.069-1.54-.188-2.274H12v4.305h6.294c-.266 1.4-1.096 2.583-2.316 3.424v2.795h3.585c2.096-1.93 3.307-4.757 3.307-8.25z" fill="#4285F4"/>
                  <path d="M12 24c3.243 0 5.962-1.072 7.949-2.915l-3.585-2.795c-.996.671-2.27 1.066-3.905 1.066-3.003 0-5.556-2.023-6.467-4.754H1.996v2.887C3.993 22.096 7.625 24 12 24z" fill="#34A853"/>
                  <path d="M5.533 14.288c-.234-.672-.366-1.39-.366-2.095s.132-1.423.366-2.095V7.291H1.996c-.732 1.465-1.156 3.14-1.156 4.693s.424 3.228 1.156 4.693L5.533 14.288z" fill="#FBBC04"/>
                  <path d="M12 4.73c1.761 0 3.342.607 4.587 1.776l3.18-3.18C17.962 1.072 15.243 0 12 0c-4.375 0-8.007 1.904-10.004 4.81L5.533 7.705c.911-2.731 3.464-4.754 6.467-4.754z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>
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
