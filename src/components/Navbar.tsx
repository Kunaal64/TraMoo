import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, X, User, PenTool, BookOpen, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Check if user is logged in
  const isAuthenticated = localStorage.getItem('token') !== null;
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  const navItems = [
    { to: '/', label: 'Home', icon: <Compass size={18} /> },
    { to: '/blogs', label: 'Stories', icon: <BookOpen size={18} /> },
    { to: '/gallery', label: 'Gallery', icon: null },
    { to: '/writers-corner', label: "Writer's Corner", icon: <PenTool size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Optional: Redirect to home or login page after logout
    navigate('/'); 
  };

  return (
    <>
      <motion.nav 
        className="fixed top-0 w-full z-50 glass border-b border-slate-200/50 dark:border-slate-800/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                className="w-8 h-8 bg-slate-800 dark:bg-slate-200 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Compass className="text-white dark:text-black" size={18} />
              </motion.div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Wanderlust
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all font-medium ${
                    location.pathname === item.to
                      ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search size={20} />
              </motion.button>
              
              <ThemeToggle />
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-all btn-hover font-medium"
                  >
                    <User size={18} />
                    <span>{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all btn-hover font-medium"
                  >
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-all btn-hover font-medium"
                >
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pb-4"
            >
              <SearchBar onClose={() => setShowSearch(false)} />
            </motion.div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                    location.pathname === item.to
                      ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <User size={18} />
                    <span>{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={() => {handleLogout(); setIsOpen(false);}}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-all font-medium"
                >
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>
      
      {/* Spacer */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;
