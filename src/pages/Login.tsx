import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { apiService } from '@/utils/api';
import { TOAST_REMOVE_DELAY } from '@/hooks/use-toast';

interface GoogleAuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    isGoogleUser: boolean;
    profilePicture?: string;
  };
}

interface FormData {
  name: string;
  email: string;
  password: string;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(false); // Set to false to show Create Account by default
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordDisabled, setIsPasswordDisabled] = useState(false); // New state to control password field
  const [formData, setFormData] = useState<FormData>({ 
    name: '', 
    email: '', 
    password: '' 
  });
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

  const handleGoogleAuth = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: 'Error',
        description: 'Failed to get Google credentials. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Send the credential to our backend for verification
      const response = await apiService.request<GoogleAuthResponse>('/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        })
      });
      
      if (response && response.token && response.user) {
        // Ensure required user fields are present
        const userData = {
          ...response.user,
          _id: response.user.id, // Map id to _id for the User type
          name: response.user.name || response.user.email.split('@')[0], // Ensure name is always defined
          email: response.user.email,
          isGoogleUser: true
        };

        // Use the auth context to handle the login
        googleLogin({
          user: userData,
          token: response.token,
          refreshToken: '' // Ensure refreshToken is explicitly provided
        });
        
        toast({
          title: 'Login Successful',
          description: 'You have successfully logged in with Google!',
          duration: TOAST_REMOVE_DELAY,
        });
        
        // Redirect to the home page or the page the user was trying to access
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // console.error('Google login error:', error); // Removed sensitive logging
      const errorMessage = error.response?.data?.message || 'Google login failed. Please try again.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const method = 'POST';
      const body = JSON.stringify(credentials);

      const response = await apiService.request<{ user: any; token: string; refreshToken: string }>( // Expect refresh token in response
        endpoint,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        }
      );

      // Use the auth context to handle the login/registration state update and token storage
      if (isLogin) {
        // The authLogin function in AuthContext already handles setting token and user
        await authLogin(credentials.email, credentials.password); // Pass credentials to authLogin
        toast({
          title: 'Login successful!',
          description: `Welcome back ${response.user.name || response.user.email}!`, // Use name from response
          variant: 'success',
          icon: <CheckCircle className="h-5 w-5 text-[hsl(var(--success-foreground))]" />
        });
      } else {
        // The register function in AuthContext already handles setting token and user
        await authLogin(credentials.email, credentials.password); // Pass credentials to authLogin
        toast({
          title: 'Account created successfully!',
          description: `Welcome ${response.user.name || response.user.email}!`, // Use name from response
          variant: 'success',
          icon: <CheckCircle className="h-5 w-5 text-[hsl(var(--success-foreground))]" />
        });
      }
        
      navigate(from, { replace: true });
    } catch (error: any) {
      // console.error('Login/Registration error:', error.message, error); // Removed sensitive logging
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

  const handleDemoLogin = async () => {
    setIsLogin(true); // Switch to login mode (Welcome Back page)
    setFormData({
      name: '', // Name is not needed for login, clear it if in create account mode
      email: 'demo@tramoo.com',
      password: 'demo',
    });
    setIsPasswordDisabled(true); // Disable password field for demo
    setIsLoading(false); // Stop loading animation immediately after filling form

    // Removed auto-login logic here. User needs to click 'Sign In' button.
    // navigate(from, { replace: true }); // No automatic navigation
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
          className="mt-6 space-y-6 glass p-8 rounded-2xl shadow-lg overflow-y-auto max-h-[calc(100vh-100px)]"
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
                  disabled={isPasswordDisabled} // Disable password field if it's a demo account
                  className="pl-10 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {!isPasswordDisabled && (
                  <button
                    type="button"
                    className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                )}
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

          <div className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[240px]">
                <GoogleLogin
                  onSuccess={handleGoogleAuth}
                  onError={() => {
                    toast({
                      title: 'Authentication Error',
                      description: 'Failed to sign in with Google. Please try again.',
                      variant: 'destructive',
                    });
                  }}
                  useOneTap={true}
                  auto_select={true}
                  theme="filled_black"
                  shape="rectangular"
                  text="continue_with"
                  size="large"
                  width="100%"
                  logo_alignment="left"
                  ux_mode="popup"
                  itp_support={true}
                  context="signin"
                  type="standard"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg">
                  or
                </span>
              </div>
            </div>

            {/* Demo Login Button */}
            <Button
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 text-white dark:text-black hover:from-green-700 hover:to-green-800 dark:hover:from-green-500 dark:hover:to-green-600 transition-colors duration-200 rounded-xl py-2 shadow-lg"
            >
              Try Demo Account
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
