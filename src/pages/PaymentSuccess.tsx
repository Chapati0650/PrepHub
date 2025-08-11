import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Star, ArrowRight, Zap, Target, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPremiumProduct } from '../stripe-config';
import Navbar from '../components/Navbar';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const premiumProduct = getPremiumProduct();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated premium status
    const refreshUserData = async () => {
      setIsRefreshing(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Delay refresh to allow webhook processing
    const timer = setTimeout(refreshUserData, 2000);
    return () => clearTimeout(timer);
  }, [refreshUser]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: Target,
      title: 'All 300 Questions',
      description: 'Access our complete question bank with unlimited practice sessions'
    },
    {
      icon: Clock,
      title: 'Unlimited Practice',
      description: 'Practice as much as you want with no daily limits or restrictions'
    },
    {
      icon: Zap,
      title: 'Advanced Features',
      description: 'Get access to detailed analytics and personalized recommendations'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Welcome to PrepHub Premium! You now have unlimited access to all 300 SAT Math questions.
          </p>
          
          {sessionId && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Transaction ID:</strong> {sessionId}
              </p>
            </div>
          )}
        </div>

        {/* Premium Features */}
        <div className="bg-gradient-primary rounded-3xl p-8 mb-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-white/20 text-white px-4 py-2 rounded-full mb-4">
              <Star className="h-4 w-4 mr-2" />
              Premium Features Unlocked
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {premiumProduct.name}
            </h2>
            <p className="text-white/80">
              {premiumProduct.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/80 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
              <p className="text-gray-600">Your premium features are being activated...</p>
            </div>
            <div className="flex items-center space-x-4">
              {isRefreshing ? (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm">Updating...</span>
                </div>
              ) : user?.is_premium ? (
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Premium Active</span>
                </div>
              ) : (
                <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Activating...</span>
                </div>
              )}
            </div>
          </div>
          
          {!user?.is_premium && !isRefreshing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                If you don't see premium features yet, they should activate within a few minutes. 
                You can also try refreshing the page or logging out and back in.
              </p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Start Practicing?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleContinue}
              className="bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
              <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              Go to Dashboard
              <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/practice')}
              className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
            >
              <Target className="h-6 w-6 mr-3" />
              Start Practice
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your premium subscription or need assistance, 
              we're here to help!
            </p>
            <div className="text-sm text-gray-500">
              <p>Email: support@prephub.com</p>
              <p className="mt-1">We typically respond within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;