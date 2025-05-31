
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, PenTool, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlogCard from '../components/BlogCard';
import UserStats from '../components/UserStats';

const Home = () => {
  const featuredBlogs = [
    {
      id: '1',
      title: 'Hidden Gems of Southeast Asia',
      excerpt: 'Discover the untold stories and secret places that make Southeast Asia a traveler\'s paradise.',
      author: 'Alex Johnson',
      date: '2024-01-15',
      readTime: '8 min read',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&h=300&fit=crop',
      tags: ['Adventure', 'Culture', 'Asia']
    },
    {
      id: '2',
      title: 'Northern Lights: A Photographer\'s Dream',
      excerpt: 'Chase the aurora borealis across Iceland and capture nature\'s most spectacular light show.',
      author: 'Maria Santos',
      date: '2024-01-12',
      readTime: '6 min read',
      imageUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=500&h=300&fit=crop',
      tags: ['Photography', 'Iceland', 'Nature']
    },
    {
      id: '3',
      title: 'Street Food Adventures in Tokyo',
      excerpt: 'Navigate the bustling streets of Tokyo and discover the best local cuisine hidden in plain sight.',
      author: 'David Kim',
      date: '2024-01-10',
      readTime: '5 min read',
      imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=300&fit=crop',
      tags: ['Food', 'Japan', 'Culture']
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden radial-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
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
              <Button asChild className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 btn-hover">
                <Link to="/blogs">
                  Explore Stories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700">
                <Link to="/gallery">
                  View Gallery
                  <Camera className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Our Community
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Join thousands of travelers sharing their adventures
            </p>
          </motion.div>
          <UserStats />
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Featured Stories
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Discover inspiring travel stories from our community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredBlogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <BlogCard {...blog} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center"
          >
            <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700">
              <Link to="/blogs">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4" />
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
            className="text-center glass p-12 rounded-2xl"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Start Your Journey
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Whether you're capturing moments, writing stories, or simply exploring, 
              there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200">
                <Link to="/writers-corner">
                  <PenTool className="mr-2 h-4 w-4" />
                  Write Your Story
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700">
                <Link to="/gallery">
                  <Camera className="mr-2 h-4 w-4" />
                  Share Photos
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
