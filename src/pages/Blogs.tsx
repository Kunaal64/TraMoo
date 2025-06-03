import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid, List } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import TagChip from '../components/TagChip';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../utils/api';
import { useSearch } from '../context/SearchContext';

const Blogs = () => {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, triggerScrollOnEnter, setTriggerScrollOnEnter } = useSearch();

  const searchResultsRef = useRef<HTMLDivElement>(null); // Ref for the search results section

  interface BlogsResponse {
    blogs: any[];
    total: number;
    page: number;
  }

  useEffect(() => {
    console.log('Blogs.tsx: useEffect triggered for data fetch. Current searchQuery:', searchQuery);
    const fetchAllBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Blogs.tsx: Calling apiService.getAllBlogs with query:', searchQuery);
        const response = await apiService.getAllBlogs(searchQuery);
        console.log('Blogs.tsx: API getAllBlogs response:', response);
        setAllBlogs(response || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        toast({
          title: "Error",
          description: "Failed to load blogs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (searchQuery !== null) { // Depend on searchQuery now
      fetchAllBlogs();
    }
  }, [searchQuery]); // Depend on searchQuery now

  // Scroll to search results section when triggerScrollOnEnter is true
  useEffect(() => {
    if (triggerScrollOnEnter && searchResultsRef.current) {
      console.log('Blogs.tsx: triggerScrollOnEnter detected. Attempting to scroll to search results.');
      setTimeout(() => {
        const offsetTop = searchResultsRef.current?.offsetTop || 0;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
        console.log('Blogs.tsx: Scrolled to offsetTop:', offsetTop);
        setTriggerScrollOnEnter(false); // Reset the trigger
      }, 100);
    } else if (!triggerScrollOnEnter) {
      console.log('Blogs.tsx: triggerScrollOnEnter is false, not scrolling.');
    }
  }, [triggerScrollOnEnter, setTriggerScrollOnEnter]);

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
      setAllBlogs(prevBlogs => 
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

  console.log('Blogs.tsx: allBlogs before flatMap:', allBlogs);
  const allTags = Array.from(new Set(Array.isArray(allBlogs) ? allBlogs.flatMap(blog => blog.tags || []) : []));

  // filteredBlogs will now reflect searchQuery dynamically
  const filteredBlogs = allBlogs;

  return (
    <div className="py-12 bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          {searchQuery ? 'Search Results' : 'Travel Stories'} {/* Update title conditionally */} 
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {searchQuery ? `Showing results for "${searchQuery}"` : 'Discover amazing adventures and experiences shared by travelers from around the world.'} {/* Update description conditionally */} 
        </p>
      </motion.div>

      {/* Search and View Mode Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        {/* Search Bar */}
        <div className="flex-grow mb-6 sm:mb-0">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-3xl transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-3xl transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </motion.div>

      {/* Blog Grid */}
      <motion.div
        ref={searchResultsRef} // Add ref here
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
      >
        {loading && <p className="text-center text-muted-foreground col-span-full">Loading stories...</p>}
        {error && <p className="text-center text-destructive col-span-full">Error loading stories.</p>}
        {!loading && !filteredBlogs.length && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 col-span-full"
          >
            <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No stories found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms.
            </p>
          </motion.div>
        )}
        {!loading && filteredBlogs.length > 0 && filteredBlogs.map((blog, index) => (
          blog._id && (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-2"
            >
              <BlogCard 
                {...blog} 
                index={index} 
                isLiked={user ? (Array.isArray(blog.likes) && blog.likes.includes(user.id)) : false}
                onLikeToggle={handleLikeToggle}
                onCardClick={() => navigate(`/blogs/${blog._id}`)}
                isSearchResult={!!searchQuery}
              />
            </motion.div>
          )
        ))}
      </motion.div>
      </div>
    </div>
  );
};

export default Blogs;
