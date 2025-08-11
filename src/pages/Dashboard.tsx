import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MathRenderer from '../components/MathRenderer';
import { useQuestions } from '../contexts/QuestionContext';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPremiumProduct } from '../stripe-config';
import PrepHubLogo from './PrepHubLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const premiumProduct = getPremiumProduct();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <PrepHubLogo size="lg" className="text-gray-900" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/practice" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Practice
            </Link>
            <Link to="/learn" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Learn
            </Link>
            {user && (
              <Link to="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-black max-w-32 truncate">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                    {user.is_premium && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-yellow-600 font-medium">{premiumProduct.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;