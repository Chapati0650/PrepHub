import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignIn from '../components/GoogleSignIn';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result?.error) {
        setError(result.error);
      }
      // Navigation is handled in the login function
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Processing Google login...');
      await loginWithGoogle(credential);
      console.log('Google login completed successfully');
      
      // Additional fallback navigation
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log('Still on login page, forcing navigation...');
          window.location.href = '/dashboard';
        }
      }, 1000);
    } catch (err) {
      console.error('Google login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google sign-in button error');
    setError('Google sign-in is temporarily unavailable. Please try signing in with email and password, or try again later.');
  };

  return (
    <div className="min-h-screen bg-gradient-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent rounded-full"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-slide-up">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass text-white/90 text-sm font-medium mb-6 animate-pulse-glow">
              <LogIn className="h-4 w-4 mr-2" />
              Welcome Back
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Sign In to
              <span className="block bg-gradient-warm bg-clip-text text-transparent animate-shimmer">
                PrepHub
              </span>
            </h2>
            <p className="text-lg text-white/80">
              Continue your SAT Math journey
            </p>
          </div>

          {/* Login Form */}
          <div className="glass rounded-3xl shadow-strong p-8 animate-scale-in">
            {/* Google Sign In */}
            <div className="mb-6">
              <GoogleSignIn
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                className="w-full"
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/60">or continue with email</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl animate-slide-up">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 glass border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-14 py-4 glass border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-2xl transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/50 hover:text-white/80" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/50 hover:text-white/80" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gradient text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-glow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-white/70">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="glass rounded-2xl p-4 text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-white/80 text-sm font-medium">Targeted Practice</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-2xl mb-2">📈</div>
              <div className="text-white/80 text-sm font-medium">Track Progress</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-white/80 text-sm font-medium">Achieve Goals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;