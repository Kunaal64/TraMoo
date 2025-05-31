import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import TagChip from '../components/TagChip';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const Blogs = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/blogs`);
        setAllBlogs(response.data.blogs || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError(err);
        toast({
          title: "Error",
          description: "Failed to load blogs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAllBlogs();
  }, []);

  const allTags = Array.from(new Set(allBlogs.flatMap(blog => blog.tags || [])));

  const filteredBlogs = allBlogs.filter(blog => 
    selectedTags.length === 0 || selectedTags.some(tag => blog.tags.includes(tag))
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Travel Stories
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover amazing adventures and experiences shared by travelers from around the world.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            
            {selectedTags.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredBlogs.length} stories found
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Tags Filter */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Filter by Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <TagChip
                  key={tag}
                  tag={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'filter'}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-4 text-sm text-orange-500 hover:text-orange-600 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Blog Grid */}
      {loading && <p className="text-center text-slate-600 dark:text-slate-400">Loading stories...</p>}
      {error && <p className="text-center text-red-500">Error loading stories.</p>}
      {!loading && !filteredBlogs.length && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No stories found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or search terms.
          </p>
          <button
            onClick={() => setSelectedTags([])}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </motion.div>
      )}
      {!loading && filteredBlogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
        >
          {filteredBlogs.map((blog, index) => (
            blog._id && (
              <Link to={`/blogs/${blog._id}`} key={blog._id}>
                <BlogCard {...blog} index={index} />
              </Link>
            )
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Blogs;
