import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import MainLayout from './layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import Login from './pages/Login';
import MyStories from './pages/MyStories';
import BlogDetail from './pages/BlogDetail';
import LikedBlogs from './pages/LikedBlogs';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import EditBlog from './pages/EditBlog';

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
              <SearchProvider>
                <ScrollToTop />
                <Chatbot />
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="blogs" element={<Blogs />} />
                    <Route path="blogs/:id" element={<BlogDetail />} />
                    <Route path="edit-blog/:id" element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <EditBlog />
                      </ProtectedRoute>
                    } />
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
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="admin" element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminPanel />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="/login" element={<Login />} />
                </Routes>
              </SearchProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;