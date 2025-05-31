
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, BookOpen, Users, Award, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WriterStats {
  storiesWritten: number;
  totalReads: number;
  activeWriters: number;
  featuredStories: number;
}

interface Story {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  readTime: number;
  publishedAt: string;
  reads: number;
  featured: boolean;
}

const WritersCorner = () => {
  const [stats, setStats] = useState<WriterStats>({
    storiesWritten: 0,
    totalReads: 0,
    activeWriters: 0,
    featuredStories: 0
  });
  const [recentStories, setRecentStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchWriterData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockStories: Story[] = [
          {
            id: '1',
            title: 'A Journey Through the Himalayas',
            excerpt: 'An incredible adventure that changed my perspective on life and travel. The mountains taught me lessons I never expected...',
            author: { name: 'Sarah Wilson', avatar: '' },
            readTime: 8,
            publishedAt: '2024-01-20',
            reads: 1250,
            featured: true
          },
          {
            id: '2',
            title: 'Street Food Adventures in Bangkok',
            excerpt: 'Discovering the hidden culinary gems of Bangkok through its vibrant street food scene. Every bite tells a story...',
            author: { name: 'Michael Chen', avatar: '' },
            readTime: 5,
            publishedAt: '2024-01-18',
            reads: 890,
            featured: false
          },
          {
            id: '3',
            title: 'Finding Peace in Norwegian Fjords',
            excerpt: 'Sometimes the most profound journeys happen in silence. My solo trip to Norway taught me the beauty of solitude...',
            author: { name: 'Emma Rodriguez', avatar: '' },
            readTime: 12,
            publishedAt: '2024-01-15',
            reads: 2100,
            featured: true
          }
        ];

        setRecentStories(mockStories);
        setStats({
          storiesWritten: mockStories.length,
          totalReads: mockStories.reduce((sum, story) => sum + story.reads, 0),
          activeWriters: new Set(mockStories.map(story => story.author.name)).size,
          featuredStories: mockStories.filter(story => story.featured).length
        });
      } catch (error) {
        console.error('Error fetching writer data:', error);
      }
    };

    fetchWriterData();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Writers Corner
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Share your travel stories and connect with fellow writers from around the world
          </p>
          <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200">
            <PenTool className="w-4 h-4 mr-2" />
            Write Your Story
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="glass p-6 rounded-2xl text-center">
            <BookOpen className="w-8 h-8 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.storiesWritten}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Stories Written</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <Users className="w-8 h-8 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalReads}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Total Reads</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <PenTool className="w-8 h-8 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.activeWriters}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Active Writers</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <Award className="w-8 h-8 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.featuredStories}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Featured Stories</div>
          </div>
        </motion.div>

        {/* Recent Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            Recent Stories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentStories.map((story, index) => (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
              >
                {story.featured && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-black mb-4">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  {story.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {story.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <div>{story.readTime} min read</div>
                  </div>
                  <div>{story.reads} reads</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full mr-3 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {story.author.name}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    Read More
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center glass p-12 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Join our community of travel writers and inspire others with your unique experiences
          </p>
          <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200">
            <PenTool className="w-4 h-4 mr-2" />
            Start Writing
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WritersCorner;
