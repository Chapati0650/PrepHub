import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuestions } from '../contexts/QuestionContext';
import PrepHubLogo from './PrepHubLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isAdmin } = useQuestions();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/practice', label: 'Practice' },
    { path: '/learn', label: 'Learn' },
    ...(user ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    ...(user && !user.is_premium ? [{ path: '/upgrade', label: 'Upgrade' }] : []),
    ...(user && isAdmin() ? [{ path: '/upload', label: 'Upload Questions' }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-xl border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="transform group-hover:scale-110 transition-transform duration-300">
              <PrepHubLogo size="md" className="text-black" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm text-gray-600 font-medium">SAT Math</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-all duration-300 group ${
                  isActive(link.path)
                    ? 'text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-warm transition-all duration-300 ${
                  isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3 glass rounded-full px-4 py-2">
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-black max-w-32 truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-300 glass rounded-full px-4 py-2 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-black font-medium transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-300 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-black transition-colors duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 glass-dark rounded-2xl mt-2 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl font-medium btn-gradient text-white text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;