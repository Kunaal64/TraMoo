
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Heart } from 'lucide-react';
import TagChip from './TagChip';

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  index?: number;
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  excerpt,
  image,
  author,
  date,
  readTime,
  tags,
  index = 0,
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="glass rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-4 left-4">
            <motion.div
              className="bg-slate-800 dark:bg-slate-200 text-white dark:text-black px-3 py-1 rounded-full text-xs font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Featured
            </motion.div>
          </div>
          <motion.button
            className="absolute top-4 right-4 w-8 h-8 glass rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart size={16} />
          </motion.button>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-all duration-300">
            {title}
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 font-medium">
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
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span className="font-medium">{author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{date}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
