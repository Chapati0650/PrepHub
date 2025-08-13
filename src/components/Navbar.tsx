import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PrepHubLogo from './PrepHubLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showExitModal, setShowExitModal] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  // Check if current user is admin (only rptestprepservices@gmail.com)
  const isAdminUser = user?.email === 'rptestprepservices@gmail.com';

  // Check if user is currently in a practice session
  const isInPracticeSession = location.pathname === '/generator';

  const handleNavigation = (path: string) => {
    if (isInPracticeSession && path !== '/generator') {
      setPendingNavigation(path);
      setShowExitModal(true);
    } else {
      navigate(path);
    }
  };

  const handleConfirmExit = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setShowExitModal(false);
      setPendingNavigation(null);
    }
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };
  const navLinks = [
    { path: '/practice', label: 'Practice' },
    { path: '/learn', label: 'Learn' },
    ...(user ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    ...(user && !user.is_premium ? [{ path: '/upgrade', label: 'Upgrade' }] : []),
    ...(user && isAdminUser ? [{ path: '/upload', label: 'Upload Questions' }] : []),
  ];

  return (
    <>
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
              <button
                key={link.path}
                onClick={() => handleNavigation(link.path)}
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
              </button>
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
                <button
                  onClick={() => handleNavigation('/login')}
                  className="text-gray-600 hover:text-black font-medium transition-colors duration-300"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-300 font-medium"
                >
                  Sign Up
                </button>
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
                <button
                  key={link.path}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleNavigation(link.path);
                  }}
                  className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleNavigation('/login');
                    }}
                    className="block px-4 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleNavigation('/register');
                    }}
                    className="block px-4 py-3 rounded-xl font-medium btn-gradient text-white text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </nav>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleCancelExit}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Exit Practice Session?
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Are you sure you want to exit your practice session? Your current progress will be lost and you'll need to start over.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCancelExit}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Stay in Session
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Exit Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;