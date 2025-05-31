
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Eye, MapPin } from 'lucide-react';

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  location: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
}

const Gallery = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalLikes: 0,
    totalViews: 0,
    activePhotographers: 0
  });

  useEffect(() => {
    // Fetch gallery data
    const fetchGalleryData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockPhotos: GalleryItem[] = [
          {
            id: '1',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
            title: 'Sunset in Santorini',
            location: 'Santorini, Greece',
            author: { name: 'Alex Johnson', avatar: '' },
            likes: 234,
            comments: 45,
            views: 1200,
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500',
            title: 'Tokyo Streets',
            location: 'Tokyo, Japan',
            author: { name: 'Maria Garcia', avatar: '' },
            likes: 189,
            comments: 32,
            views: 890,
            createdAt: '2024-01-12'
          },
          {
            id: '3',
            imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500',
            title: 'Northern Lights',
            location: 'Iceland',
            author: { name: 'John Smith', avatar: '' },
            likes: 456,
            comments: 78,
            views: 2100,
            createdAt: '2024-01-10'
          }
        ];

        setPhotos(mockPhotos);
        setStats({
          totalPhotos: mockPhotos.length,
          totalLikes: mockPhotos.reduce((sum, photo) => sum + photo.likes, 0),
          totalViews: mockPhotos.reduce((sum, photo) => sum + photo.views, 0),
          activePhotographers: new Set(mockPhotos.map(photo => photo.author.name)).size
        });
      } catch (error) {
        console.error('Error fetching gallery data:', error);
      }
    };

    fetchGalleryData();
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
            Travel Gallery
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover breathtaking moments captured by our community of travelers
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="glass p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalPhotos}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Photos Shared</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalLikes}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Total Likes</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalViews}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Total Views</div>
          </div>
          <div className="glass p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.activePhotographers}
            </div>
            <div className="text-slate-600 dark:text-slate-400">Photographers</div>
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Eye className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {photo.title}
                </h3>
                
                <div className="flex items-center text-slate-600 dark:text-slate-400 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{photo.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{photo.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{photo.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{photo.views}</span>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full mr-3"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {photo.author.name}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
