import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Heart, MessageSquare } from 'lucide-react';
import TagChip from './TagChip';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface BlogCardProps {
  _id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  image?: string;
  images?: string[];
  author: { name: string; avatar?: string; };
  createdAt: string;
  readTime?: number;
  tags: string[];
  likes: string[];
  comments: any[]; // Consider a more specific type if needed
  index?: number;
  isLiked?: boolean;
  onLikeToggle?: (_id: string) => void; // Function to call when like button is toggled
  onCardClick?: () => void; // New prop for card click navigation
  isSearchResult?: boolean; // New prop to indicate if it's a search result
}

const BlogCard: React.FC<BlogCardProps> = ({
  _id,
  title,
  subtitle,
  excerpt,
  image,
  images,
  author,
  createdAt,
  readTime,
  tags,
  likes,
  comments,
  index = 0,
  isLiked = false,
  onLikeToggle,
  onCardClick,
  isSearchResult = false,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes.length);

  // Update local state when props change
  useEffect(() => {
    setIsLikedState(isLiked);
    setLikesCount(likes.length);
  }, [isLiked, likes]);

  useEffect(() => {
    if (images && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000); // 3 seconds
      return () => clearInterval(interval);
    }
  }, [images]);

  const getFullImageUrl = (path) => {
    if (!path) return '/images/placeholder.svg';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  };

  const imageUrl = images && images.length > 0 
    ? getFullImageUrl(images[currentImageIndex]) 
    : image 
      ? getFullImageUrl(image) 
      : '/images/placeholder.svg';

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col"
    >
      <div
        className={`glass rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 ${isSearchResult ? 'border-primary' : ''} flex-grow flex flex-col`}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={onCardClick}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-4 left-4">
            {/* You can add a featured tag here if needed */}
            {/* <motion.div
              className="bg-slate-800 dark:bg-slate-200 text-white dark:text-black px-3 py-1 rounded-full text-xs font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Featured
            </motion.div> */}
          </div>
          <motion.button
            onClick={(e) => {
              e.preventDefault(); // Prevent navigating to blog detail
              e.stopPropagation(); // Prevent event from bubbling up to Link
              if (onLikeToggle) {
                // Optimistic update
                setIsLikedState(!isLikedState);
                setLikesCount(prev => isLikedState ? prev - 1 : prev + 1);
                onLikeToggle(_id);
              }
            }}
            className={`absolute top-4 left-4 w-8 h-8 glass rounded-full flex items-center justify-center ${
              isLikedState 
                ? 'text-red-500' 
                : 'text-white opacity-0 group-hover:opacity-100'
            } transition-all duration-300`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isLikedState ? 'Unlike this post' : 'Like this post'}
          >
            <Heart 
              size={16} 
              fill={isLikedState ? 'currentColor' : 'none'} 
              className={`transition-transform duration-200 ${isLikedState ? 'scale-110' : 'scale-100'}`}
            />
          </motion.button>
        </div>
        
        <div className="p-6 cursor-pointer flex flex-col flex-grow" onClick={onCardClick}>
          <h3 className={`text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-all duration-300 ${
            isSearchResult ? 'gradient-text-hero' : ''
          }`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">{subtitle}</p>
          )}
          
          <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 font-medium flex-grow">
            {excerpt}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                +{tags.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs dark:bg-primary-foreground dark:text-primary">{getInitials(author?.name || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{author?.name || 'Unknown Author'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Heart size={14} fill={isLikedState ? 'currentColor' : 'none'} className={isLikedState ? 'text-red-500' : ''} />
                <span>{likesCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare size={14} />
                <span>{comments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
