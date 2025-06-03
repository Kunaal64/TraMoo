import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, X, User, PenTool, BookOpen, Compass, Heart, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isSearchOpen, setIsSearchOpen, setSearchQuery } = useSearch();

  // Check if user is logged in
  const isAuthenticated = localStorage.getItem('token') !== null;
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  const navItems = [
    { to: '/', label: 'Home', icon: <Compass size={18} /> },
    { to: '/blogs', label: 'Stories', icon: <BookOpen size={18} /> },
    { to: '/liked-blogs', label: 'Favorites', icon: <Heart size={18} /> },
    { to: '/writers-corner', label: "Writer's Corner", icon: <PenTool size={18} /> },
  ];

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);

    // Close search when navigating to /blogs
    if (location.pathname === '/blogs') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, setIsSearchOpen, setSearchQuery]);

  const navbarBgClass = theme === 'dark' ? 'bg-neutral-900/90 backdrop-blur-md' : 'bg-gray-200/90 backdrop-blur-md';

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const showNavbarSearch = isSearchOpen && location.pathname !== '/blogs';
  const showSearchIcon = location.pathname !== '/blogs';

  return (
    <>
      <motion.nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${navbarBgClass}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          willChange: 'transform, opacity',
          boxShadow: theme === 'dark' 
            ? '0 4px 10px -2px rgba(0, 0, 0, 0.2), 0 5px 25px rgba(0,0,0,0.8)' /* Darker, more pronounced blur */
            : '0 4px 10px -2px rgba(0, 0, 0, 0.1), 0 5px 25px rgba(0,0,0,0.2)' /* Lighter, more pronounced blur */
        }} /* Increased blur for bottom border */
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Compass className="text-primary-foreground" size={18} />
              </motion.div>
              <span className="text-xl font-bold gradient-text-hero">
                Wanderlust
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all font-medium ${
                    location.pathname === item.to
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {showSearchIcon && (
                <motion.button
                  onClick={handleSearchToggle}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={20} />
                </motion.button>
              )}
              
              <ThemeToggle />
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all btn-hover font-medium"
                  >
                    <User size={18} />
                    <span>{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-all btn-hover font-medium"
                  >
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all btn-hover font-medium"
                >
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search Bar (conditional rendering) */}
          {showNavbarSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pb-4"
            >
              <SearchBar onClose={() => {setIsSearchOpen(false); setSearchQuery('');}} />
            </motion.div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass bg-background border-t border-border"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    location.pathname === item.to
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <User size={18} />
                    <span>{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={() => {handleLogout(); setIsOpen(false);}}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
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
