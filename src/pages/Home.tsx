import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, PenTool, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlogCard from '../components/BlogCard';
import UserStats from '../components/UserStats';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../utils/api';

const Home = () => {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getBlogs(1, 3);
        console.log('Featured Blogs Data:', response);
        setFeaturedBlogs(response || []);
      } catch (err) {
        console.error('Error fetching featured blogs:', err);
        setError(err);
        toast({
          title: "Error",
          description: "Failed to load featured blogs. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedBlogs();
  }, []);

  const handleLikeToggle = async (blogId: string) => {
    if (!user || !token) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to like a post.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await apiService.likeBlog(blogId);
      setFeaturedBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog._id === blogId ? { ...blog, likes: response.likes } : blog
        )
      );
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update like status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen-minus-navbar flex items-center justify-center"
        style={{
          backgroundImage: `url('/hero-dark-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed', /* For parallax effect */
        }}
      >
        {/* Overlay for text readability */}
        <div className="absolute inset-0 dark:bg-black/50 bg-white/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold text-foreground mb-6 gradient-text-hero"
            style={{ willChange: 'transform, opacity' }}
          >
            Wanderlust
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl font-bold text-white dark:text-foreground mb-8 max-w-3xl mx-auto"
            style={{ willChange: 'transform, opacity' }}
          >
            Discover the world through the eyes of fellow travelers. Share your stories, capture moments, and inspire others to explore.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/blogs">
                Explore Stories
                <ArrowRight className="ml-2 h-4 w-4 text-primary-foreground" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/blogs">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4 text-foreground" />
              </Link>
            </Button>
          </motion.div>
        </div>
        {/* Scroll Down Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground cursor-pointer z-10"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <ArrowDownCircle size={36} className="text-foreground" />
        </motion.div>
      </section>

      {/* Community Stats */}
      <section 
        className="py-16 bg-card dark:bg-card"
        style={{
          boxShadow: theme === 'dark' 
            ? '0 -5px 25px rgba(0,0,0,0.8)' /* Darker, more pronounced blur */
            : '0 -5px 25px rgba(0,0,0,0.2)' /* Lighter, more pronounced blur */
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Our Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of travelers sharing their adventures
            </p>
          </motion.div>
          <UserStats />
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Featured Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover inspiring travel stories from our community
            </p>
          </motion.div>
          {loading && <p className="text-center text-muted-foreground">Loading featured stories...</p>}
          {error && <p className="text-center text-destructive">Error loading featured stories.</p>}
          {!loading && !featuredBlogs.length && <p className="text-center text-muted-foreground">No featured stories found.</p>}

          {!loading && featuredBlogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 py-4">
              {Array.from({ length: 3 }).map((_, index) => {
                const blog = featuredBlogs[index];
                return blog ? (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="w-full"
                  >
                    <BlogCard 
                      {...blog} 
                      isLiked={user ? (Array.isArray(blog.likes) && blog.likes.includes(user.id)) : false} 
                      onLikeToggle={handleLikeToggle}
                      onCardClick={() => navigate(`/blogs/${blog._id}`)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`placeholder-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="w-full flex items-center justify-center bg-card-foreground/10 text-muted-foreground rounded-lg h-full p-4 border border-dashed border-muted-foreground/30"
                    style={{ minHeight: '300px' }}
                  >
                    <p>No Story Yet</p>
                  </motion.div>
                );
              })}
            </div>
          )}
          

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center"
          >
            <Button
              asChild
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/blogs">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4 text-foreground" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-card dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-center glass p-12 rounded-2xl shadow-lg"
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Start Your Journey
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're capturing moments, writing stories, or simply exploring, there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/writers-corner">
                  <PenTool className="mr-2 h-4 w-4 text-primary-foreground" />
                  Write Your Story
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;