import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Search } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { apiService } from '../utils/api';

const LikedBlogs = () => {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLikedBlogs = async () => {
      if (!user || !token) {
        setLoading(false);
        setError(new Error("You must be logged in to view liked blogs."));
        return;
      }
      setLoading(true);
      try {
        // Assuming your backend has an endpoint to fetch liked blogs for the current user
        const response = await apiService.request<{ blogs: any[] }>('/blogs/liked');
        setLikedBlogs(response.blogs || []);
      } catch (err) {
        console.error('Error fetching liked blogs:', err);
        setError(err);
        toast({
          title: "Error",
          description: "Failed to load liked blogs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchLikedBlogs();
  }, [user, token, toast]);

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
      setLikedBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog._id === blogId ? { ...blog, likes: response.likes } : blog
        ).filter(blog => Array.isArray(blog.likes) && user && blog.likes.includes(user.id)) // Filter out unliked blogs
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          My Favourites
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          All the stories you've loved, in one place.
        </p>
      </motion.div>

      {loading && <p className="text-center text-muted-foreground">Loading your liked stories...</p>}
      {error && <p className="text-center text-destructive">Error: {error.message}</p>}
      {!loading && !likedBlogs.length && (user ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No favourites found
          </h3>
          <p className="text-muted-foreground mb-6">
            Start exploring stories and hit the heart icon to add them here!
          </p>
          <Link to="/blogs">
            <Button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-3xl transition-colors">
              Explore Stories
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Login to see your favourites
          </h3>
          <p className="text-muted-foreground mb-6">
            Please log in to view and manage your liked blog posts.
          </p>
          <Link to="/login">
            <Button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-3xl transition-colors">
              Login
            </Button>
          </Link>
        </motion.div>
      ))}
      {!loading && likedBlogs.length > 0 && (user ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {likedBlogs.map((blog, index) => (
            blog._id && (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <BlogCard 
                      {...blog} 
                      index={index} 
                      isLiked={user ? (Array.isArray(blog.likes) && blog.likes.includes(user.id)) : false}
                      onLikeToggle={handleLikeToggle}
                      onCardClick={() => navigate(`/blogs/${blog._id}`)}
                    />
                  </motion.div>
            )
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Login to see your favourites
          </h3>
          <p className="text-muted-foreground mb-6">
            Please log in to view and manage your liked blog posts.
          </p>
          <Link to="/login">
            <Button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-3xl transition-colors">
              Login
            </Button>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default LikedBlogs; 