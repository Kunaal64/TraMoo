import React from 'react';
import { Compass, Heart, Github, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Linkedin, Code } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                <Compass className="text-primary-foreground" size={18} />
              </div>
              <span className="text-xl font-bold gradient-text-hero gradient-text-animated">
                TraMoo
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Share your travel adventures and discover amazing stories from fellow wanderers around the globe.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blogs" className="text-muted-foreground hover:text-orange-500 transition-colors">
                  Travel Stories
                </Link>
              </li>
              <li>
                <Link to="/writers-corner" className="text-muted-foreground hover:text-orange-500 transition-colors">
                  Writer's Corner
                </Link>
              </li>
              <li>
                <Link to="/liked-blogs" className="text-muted-foreground hover:text-orange-500 transition-colors">
                  Favourites
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Developer
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com/Kunaal64" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors">
                  <Github size={20} />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/kunaall/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors">
                  <Linkedin size={20} />
                  <span>Linkedin</span>
                </a>
              </li>
              <li>
                <a href="https://portfolio-kaash.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors">
                  <Code size={20} />
                  <span>Portfolio</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col items-center justify-center">
            <p className="text-muted-foreground text-sm text-center gradient-text-animated">
              TraMoo.. Made with <Heart className="inline w-4 h-4 text-destructive" /> by Kaash.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
