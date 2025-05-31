import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MapPin } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="text-white" size={48} />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Lost in the Journey
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Looks like you've wandered off the beaten path. This page doesn't exist in our travel map.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Home size={18} />
            <span>Back to Home</span>
          </Link>
          
          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Or explore these popular destinations:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/blogs"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Travel Stories
              </Link>
              <Link
                to="/writers-corner"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Writer's Corner
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
