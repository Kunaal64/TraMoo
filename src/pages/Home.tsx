import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlogCard from '../components/BlogCard';
import UserStats from '../components/UserStats';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const Home = () => {
  const { toast } = useToast();
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/blogs?featured=true`);
        setFeaturedBlogs(response.data.blogs || []);
      } catch (err) {
        console.error('Error fetching featured blogs:', err);
        setError(err);
        toast({
          title: "Error",
          description: "Failed to load featured blogs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden radial-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-slate-100 mb-6"
          >
            Wanderlust
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto"
          >
            Discover the world through the eyes of fellow travelers. Share your stories, capture moments, and inspire others to explore.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              asChild
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              <Link to="/blogs">
                Explore Stories
                <ArrowRight className="ml-2 h-4 w-4 text-white dark:text-black" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <Link to="/blogs">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4 text-slate-900 dark:text-white" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Our Community
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Join thousands of travelers sharing their adventures
            </p>
          </motion.div>
          <UserStats />
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Featured Stories
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Discover inspiring travel stories from our community
            </p>
          </motion.div>
          {loading && <p className="text-center text-slate-600 dark:text-slate-400">Loading featured stories...</p>}
          {error && <p className="text-center text-red-500">Error loading featured stories.</p>}
          {!loading && !featuredBlogs.length && <p className="text-center text-slate-600 dark:text-slate-400">No featured stories found.</p>}

          {!loading && featuredBlogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredBlogs.map((blog, index) => (
                blog._id && (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/blogs/${blog._id}`}>
                      <BlogCard {...blog} />
                    </Link>
                  </motion.div>
                )
              ))}
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
              className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <Link to="/blogs">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4 text-slate-900 dark:text-white" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-center glass p-12 rounded-2xl shadow-lg"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Start Your Journey
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Whether you're capturing moments, writing stories, or simply exploring, there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
              >
                <Link to="/writers-corner">
                  <PenTool className="mr-2 h-4 w-4 text-white dark:text-black" />
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