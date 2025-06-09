import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, X, User, PenTool, BookOpen, Compass, Heart, LogOut, UserCog } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SheetClose } from '@/components/ui/sheet';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isSearchOpen, setIsSearchOpen, setSearchQuery } = useSearch();

  // Debug: Log user object when it changes
  useEffect(() => {
    console.log('Current user in Navbar:', user);
    if (user) {
      console.log('User role:', user.role);
      console.log('Is admin/owner:', user.role === 'admin' || user.role === 'owner');
    }
  }, [user]);

  // Base navigation items that are always visible
  const baseNavItems = [
    { to: '/', label: 'Home', icon: <Compass size={18} /> },
    { to: '/blogs', label: 'Stories', icon: <BookOpen size={18} /> },
    { to: '/liked-blogs', label: 'Favourites', icon: <Heart size={18} /> },
    { to: '/writers-corner', label: "Writer's Corner", icon: <PenTool size={18} /> },
  ];

  // Admin navigation items - only visible to admins/owners
  const adminNavItems = (user?.role === 'admin' || user?.role === 'owner')
    ? [{ to: '/admin', label: 'Admin Space', icon: <UserCog size={18} /> }]
    : [];

  // Combine all navigation items
  const navItems = [...baseNavItems, ...adminNavItems];

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
            ? '0 4px 10px -2px rgba(0, 0, 0, 0.2), 0 5px 25px rgba(0,0,0,0.8)'
            : '0 4px 10px -2px rgba(0, 0, 0, 0.1), 0 5px 25px rgba(0,0,0,0.2)'
        }}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Left section - Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <motion.div
                  className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Compass className="text-primary-foreground" size={18} />
                </motion.div>
                <span className="text-xl font-bold gradient-text-hero">
                  TraMoo
                </span>
              </Link>
            </div>

            {/* Center section - Navigation */}
            <div className="hidden md:flex items-center justify-center flex-1 px-4">
              <nav className="w-full max-w-2xl">
                <ul className="flex items-center justify-between w-full">
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center space-x-2 px-4 h-10 rounded-xl transition-all font-medium ${
                          location.pathname === item.to
                            ? 'text-foreground bg-secondary'
                            : 'text-muted-foreground hover:text-orange-500 hover:bg-accent/50 dark:hover:text-orange-400'
                        }`}
                      >
                        {item.icon}
                        <span className="whitespace-nowrap">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Right-aligned actions */}
            <div className="flex items-center space-x-3 ml-auto">
              {showSearchIcon && (
                <motion.button
                  onClick={handleSearchToggle}
                  className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={20} />
                </motion.button>
              )}
              
              <div className="h-10 flex items-center">
                <ThemeToggle />
              </div>
              
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-4">
                    <NavLink
                      to="/profile"
                      className="flex-shrink-0 flex items-center h-10 px-4 space-x-2 rounded-xl transition-all font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs dark:bg-primary-foreground dark:text-primary">
                          {getInitials(user?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap max-w-[120px] truncate">{user?.name || 'Profile'}</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex-shrink-0 flex items-center h-10 px-4 rounded-xl transition-all font-medium text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
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
                className="md:hidden p-2 -mr-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
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
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    location.pathname === item.to
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-orange-400'
                  }`}
                >
                  {React.cloneElement(item.icon, { size: 20 })}
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 py-2 rounded-md transition-colors text-muted-foreground hover:text-orange-500"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground dark:bg-primary-foreground dark:text-primary">{getInitials(user?.name || '')}</AvatarFallback>
                    </Avatar>
                    <span>{user?.name || 'Profile'}</span>
                  </NavLink>
                  <button
                    onClick={() => {handleLogout(); setIsOpen(false);}}
                    className="w-full flex items-center space-x-2 py-2 rounded-md transition-colors text-muted-foreground hover:text-orange-500"
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
