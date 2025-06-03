import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import MainLayout from './layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import Login from './pages/Login';
import MyStories from './pages/MyStories';
import BlogDetail from './pages/BlogDetail';
import LikedBlogs from './pages/LikedBlogs';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();


const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="blogs" element={<Blogs />} />
                  <Route path="blogs/:id" element={<BlogDetail />} />
                  <Route path="liked-blogs" element={
                    <ProtectedRoute>
                      <LikedBlogs />
                    </ProtectedRoute>
                  } />
                  <Route path="writers-corner" element={
                    <ProtectedRoute>
                      <MyStories />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/login" element={<Login />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;