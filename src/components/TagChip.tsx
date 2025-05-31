
import React from 'react';
import { motion } from 'framer-motion';

interface TagChipProps {
  tag: string;
  onClick?: () => void;
  variant?: 'default' | 'filter';
}

const TagChip: React.FC<TagChipProps> = ({ tag, onClick, variant = 'default' }) => {
  const baseClasses = "inline-block px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer";
  const variantClasses = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    filter: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
  };

  return (
    <motion.span
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      #{tag}
    </motion.span>
  );
};

export default TagChip;
