import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { user: User; token: string; refreshToken?: string }) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      const response = await apiService.request<{ user: User }>('/auth/me');
      if (response && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        throw new Error('Invalid auth status response');
      }
    } catch (error) {
      console.error('AuthContext: checkAuthStatus - Error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const login = (data: { user: User; token: string; refreshToken?: string }) => {
    console.log('Login data received:', data);
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    // Ensure user object has all required fields
    const userWithDefaults = {
      ...data.user,
      role: data.user.role || 'user', // Ensure role is set, default to 'user'
    };
    console.log('Setting user with data:', userWithDefaults);
    localStorage.setItem('user', JSON.stringify(userWithDefaults));
    setUser(userWithDefaults);
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.request<{ user: User; token: string; refreshToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      login(response);

      toast({
        title: 'Registration Successful',
        description: 'Welcome! Your account has been created.',
      });
    } catch (error) {
      console.error('AuthContext: register - Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await apiService.request('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('AuthContext: logout - Error sending logout request to backend:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await apiService.request<User>('/auth/update', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (error) {
      console.error('AuthContext: updateUser - Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, token: localStorage.getItem('token') }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};