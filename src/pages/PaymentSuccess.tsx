import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Star, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPremiumProduct } from '../stripe-config';
import Navbar from '../components/Navbar';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const premiumProduct = getPremiumProduct();

  useEffect(() => {
    const refreshUserData = async () => {
      // Give webhook time to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshUserData();
  }, [refreshUser]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center animate-slide-up">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Payment Successful! 🎉
          </h1>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg mb-8 animate-scale-in">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-primary text-white px-4 py-2 rounded-full flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span className="font-bold">{premiumProduct.name}</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to {premiumProduct.name}!
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              {premiumProduct.description}
            </p>

            {isRefreshing ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center">
                  <Loader className="h-5 w-5 text-blue-600 animate-spin mr-3" />
                  <span className="text-blue-800">Activating your premium features...</span>
                </div>
              </div>
            ) : user?.is_premium ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-800 font-semibold">Premium features activated!</span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                <p className="text-yellow-800 text-sm">
                  Your payment is being processed. Premium features will be available shortly.
                  If you don't see them in a few minutes, please refresh the page.
                </p>
              </div>
            )}

            {/* What's Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-gray-900">300+ Questions</span>
                </div>
                <p className="text-gray-600 text-sm">Access to our complete question bank</p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-gray-900">Advanced Analytics</span>
                </div>
                <p className="text-gray-600 text-sm">Detailed performance tracking</p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-gray-900">Unlimited Practice</span>
                </div>
                <p className="text-gray-600 text-sm">No daily limits or restrictions</p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="font-semibold text-gray-900">Priority Support</span>
                </div>
                <p className="text-gray-600 text-sm">Get help when you need it</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/practice')}
                className="bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
              >
                <Zap className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                Start Premium Practice
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
              >
                View Dashboard
              </button>
            </div>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-gray-600 text-sm">
                Transaction ID: <code className="font-mono text-xs">{sessionId}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;