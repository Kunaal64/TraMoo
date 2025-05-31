
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import TagChip from '../components/TagChip';
import SearchBar from '../components/SearchBar';

const Blogs = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sample blog data
  const blogs = [
    {
      id: '1',
      title: 'Hidden Gems of Santorini: Beyond the Tourist Trail',
      excerpt: 'Discover the secret spots and local favorites that make Santorini truly magical. From hidden beaches to authentic tavernas, explore the island like a local.',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=500&h=300&fit=crop',
      author: 'Maria Rodriguez',
      date: 'Nov 15, 2024',
      location: 'Santorini, Greece',
      readTime: '8 min read',
      tags: ['Greece', 'Islands', 'Hidden Gems', 'Mediterranean'],
    },
    {
      id: '2',
      title: 'Trekking Through the Himalayas: A Journey of Self-Discovery',
      excerpt: 'My transformative 15-day trek through the Annapurna Circuit and the lessons learned along the way. A story of perseverance, breathtaking views, and personal growth.',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500&h=300&fit=crop',
      author: 'Alex Thompson',
      date: 'Nov 12, 2024',
      location: 'Nepal',
      readTime: '12 min read',
      tags: ['Nepal', 'Trekking', 'Adventure', 'Mountains', 'Self-Discovery'],
    },
    {
      id: '3',
      title: 'Street Food Safari: Flavors of Bangkok',
      excerpt: 'A culinary adventure through the bustling streets and hidden food courts of Thailand\'s capital. Taste authentic dishes and learn from local food vendors.',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&h=300&fit=crop',
      author: 'Sarah Kim',
      date: 'Nov 10, 2024',
      location: 'Bangkok, Thailand',
      readTime: '6 min read',
      tags: ['Thailand', 'Food', 'Culture', 'Street Food', 'Asia'],
    },
    {
      id: '4',
      title: 'Northern Lights Quest in Iceland',
      excerpt: 'Chasing the Aurora Borealis across Iceland\'s dramatic landscapes. Tips for the best viewing spots and photography techniques for capturing this natural wonder.',
      image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=500&h=300&fit=crop',
      author: 'Erik Larsson',
      date: 'Nov 8, 2024',
      location: 'Iceland',
      readTime: '10 min read',
      tags: ['Iceland', 'Northern Lights', 'Photography', 'Nature', 'Arctic'],
    },
    {
      id: '5',
      title: 'Safari Adventures in Kenya',
      excerpt: 'An unforgettable journey through the Maasai Mara during the Great Migration. Wildlife encounters that will change your perspective on nature.',
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=500&h=300&fit=crop',
      author: 'David Ochieng',
      date: 'Nov 5, 2024',
      location: 'Kenya',
      readTime: '9 min read',
      tags: ['Kenya', 'Safari', 'Wildlife', 'Africa', 'Photography'],
    },
    {
      id: '6',
      title: 'Cultural Immersion in Japanese Temples',
      excerpt: 'Living with monks in Kyoto temples and learning about Zen Buddhism. A spiritual journey through Japan\'s most sacred spaces.',
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&h=300&fit=crop',
      author: 'Yuki Tanaka',
      date: 'Nov 2, 2024',
      location: 'Kyoto, Japan',
      readTime: '11 min read',
      tags: ['Japan', 'Culture', 'Temples', 'Spirituality', 'Buddhism'],
    },
  ];

  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags)));

  const filteredBlogs = blogs.filter(blog => 
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
          <BlogCard key={blog.id} {...blog} index={index} />
        ))}
      </motion.div>

      {/* No Results */}
      {filteredBlogs.length === 0 && (
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
    </div>
  );
};

export default Blogs;
