import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check, Zap, Target, TrendingUp, Clock, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Upgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'All 300 Questions',
      description: 'Access our complete question bank with unlimited practice sessions'
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Detailed performance insights and personalized improvement recommendations'
    },
    {
      icon: Clock,
      title: 'Unlimited Time',
      description: 'Practice as much as you want with no daily limits or restrictions'
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: 'Get faster responses and dedicated help when you need it most'
    }
  ];

  const comparisonFeatures = [
    { feature: 'Practice Questions', free: '30 questions', premium: '300+ questions' },
    { feature: 'Daily Practice Limit', free: 'Limited sessions', premium: 'Unlimited' },
    { feature: 'Performance Analytics', free: 'Basic stats', premium: 'Advanced insights' },
    { feature: 'Question Types', free: 'Mixed only', premium: 'All categories' },
    { feature: 'Support', free: 'Community', premium: 'Priority support' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-primary text-white text-sm font-medium mb-6">
            <Star className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Unlock Your Full
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              SAT Potential
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Get exclusive access to 300 carefully curated SAT questions that are highly likely to appear on your next test. Upgrade now for only $14.99 and boost your score!
          </p>
        </div>

        {/* Pricing Card */}
        {/* Custom Text Section Above Pricing */}
        <div className="max-w-4xl mx-auto mb-8 text-center animate-scale-in">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              If you're targeting a perfect 800 on the Digital SAT Math, this upgrade is made for you! Our exclusive collection of 300 premium SAT Math questions features expert-level practice tailored to the toughest problems most likely to appear on your next test.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              For those finding the second, more challenging module of the SAT difficult, this feature provides the most advanced concepts, equations, formulas, and proven strategies to help you elevate your score to 750+ and beyond.
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white border-2 border-blue-200 rounded-3xl p-8 shadow-xl animate-scale-in relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-primary text-white px-6 py-2 rounded-full text-sm font-bold">
                Most Popular
              </div>
            </div>

            <div className="text-center pt-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Access</h2>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$14</span>
                <span className="text-xl text-gray-600">.99</span>
                <div className="text-gray-600 text-sm">per month</div>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-primary text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group mb-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Upgrade Now
                    <Zap className="h-5 w-5 ml-2 group-hover:animate-bounce" />
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="text-center text-gray-500 text-sm">
                <Shield className="h-4 w-4 inline mr-1" />
                Secure payment powered by Stripe
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg animate-scale-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Free vs Premium</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-600">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{item.feature}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{item.free}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-blue-600 font-medium">{item.premium}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Upgrade;