import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, BookOpen, Calculator, BarChart3, Upload, Crown } from 'lucide-react';
import PrepHubLogo from './PrepHubLogo';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <PrepHubLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">PrepHub</span>
          </Link>

          {/* Navigation Links */}
          {user ? (
            <div className="flex items-center space-x-1">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <BarChart3 className="h-4 w-4 inline mr-1" />
                Dashboard
              </Link>
              <Link to="/practice" className={navLinkClass('/practice')}>
                <Calculator className="h-4 w-4 inline mr-1" />
                Practice
              </Link>
              <Link to="/learn" className={navLinkClass('/learn')}>
                <BookOpen className="h-4 w-4 inline mr-1" />
                Learn
              </Link>
              <Link to="/generator" className={navLinkClass('/generator')}>
                <Upload className="h-4 w-4 inline mr-1" />
                Generator
              </Link>
              {!user.is_premium && (
                <Link to="/upgrade" className={navLinkClass('/upgrade')}>
                  <Crown className="h-4 w-4 inline mr-1" />
                  Upgrade
                </Link>
              )}
              
              {/* User Menu */}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;