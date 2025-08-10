import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar,
  BarChart3,
  Zap,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuestions } from '../contexts/QuestionContext';
import Navbar from '../components/Navbar';

interface UserProgress {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  lastPracticeDate: string | null;
}

interface TopicMastery {
  topic: string;
  masteryPercentage: number;
}

interface RecentSession {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  date: string;
  timeSpent: number;
}

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const { getUserProgress, getTopicMastery, getRecentSessions } = useQuestions();
  
  // Add debugging for dashboard
  console.log('🏠 Dashboard component rendered');
  console.log('👤 Current user:', user);
  console.log('⏳ User loading state:', user === null ? 'No user' : 'User exists');
  
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh user data to get updated premium status with delay
      console.log('💳 Payment success detected, refreshing user data...');
      setTimeout(() => {
        refreshUser();
      }, 2000); // Give webhook time to process
    }

    const loadDashboardData = async () => {
      try {
        console.log('🔄 Loading dashboard data...');
        const [progressData, masteryData, sessionsData] = await Promise.all([
          getUserProgress(),
          getTopicMastery(),
          getRecentSessions(5)
        ]);

        console.log('📊 Dashboard data loaded:', {
          progress: progressData,
          mastery: masteryData,
          sessions: sessionsData
        });

        setProgress(progressData);
        setTopicMastery(masteryData);
        setRecentSessions(sessionsData);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, getUserProgress, getTopicMastery, getRecentSessions]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccuracyPercentage = () => {
    if (!progress || progress.totalQuestionsAnswered === 0) return 0;
    return Math.round((progress.totalCorrectAnswers / progress.totalQuestionsAnswered) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your dashboard</h1>
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Payment Successful! 🎉</h3>
                <p className="text-green-700">Welcome to PrepHub Premium! You now have access to all 300 questions and advanced features.</p>
                <p className="text-green-600 text-sm mt-1">If you don't see premium features yet, try the refresh button below.</p>
                <button
                  onClick={async () => {
                    console.log('🔄 Manual refresh triggered');
                    await refreshUser();
                    window.location.reload();
                  }}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Refresh Status
                </button>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 animate-slide-up">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-red-600 hover:text-red-800 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Webhook Test Button for Debugging */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 animate-slide-up">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Webhook Configuration</h3>
              <p className="text-blue-700 text-sm">Your Stripe webhook URL should be exactly:</p>
              <code className="block bg-blue-100 p-2 rounded text-xs mt-2 text-blue-800">
                https://ehlklfopwpmgkthqmqgd.supabase.co/functions/v1/stripe-webhook
              </code>
              <p className="text-blue-700 text-xs mt-2">
                Required events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing webhook logic...');
                    setError('Testing webhook...');
                    
                   console.log('🔗 Making request to:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-webhook`);
                   console.log('🔑 Using auth token:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
                   console.log('👤 User ID:', user.id);
                   
                    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-webhook`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ userId: user.id })
                    });

                    console.log('🧪 Test webhook response status:', response.status);
                    console.log('🧪 Test webhook response headers:', Object.fromEntries(response.headers.entries()));
                    
                    const text = await response.text();
                    console.log('🧪 Test webhook response text:', text);
                   if (!response.ok) {
                     console.error('❌ Response not OK:', response.status, response.statusText);
                     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                   }
                   
                    
                    let result;
                    try {
                      result = JSON.parse(text);
                    } catch (parseError) {
                      console.error('🧪 Failed to parse response as JSON:', parseError);
                      throw new Error(`Invalid response: ${text}`);
                    }
                    
                    if (result.success) {
                      console.log('✅ Webhook test successful:', result);
                      setError('');
                      alert(`✅ Webhook test successful! ${result.message}`);
                      await refreshUser();
                      window.location.reload();
                    } else {
                      console.error('❌ Webhook test failed:', result);
                      setError(`Webhook test failed: ${result.error}`);
                      alert(`❌ Webhook test failed: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('Test webhook error:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    setError(`Test webhook error: ${errorMessage}`);
                    alert(`❌ Failed to test webhook: ${errorMessage}`);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Test Webhook Logic
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('https://ehlklfopwpmgkthqmqgd.supabase.co/functions/v1/stripe-webhook', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ test: true })
                    });
                    
                    const text = await response.text();
                    console.log('Webhook response:', text);
                    
                   if (!text) {
                     throw new Error('Empty response from webhook');
                   }
                   
                    if (response.status === 400 && text.includes('Missing signature')) {
                      alert('✅ Webhook endpoint is reachable! (Expected "Missing signature" error)');
                    } else {
                      alert(`Webhook response: ${response.status} - ${text}`);
                    }
                  } catch (error) {
                    console.error('Webhook ping error:', error);
                    alert(`❌ Webhook endpoint error: ${error.message}`);
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                Ping Webhook Endpoint
              </button>
              
              <button
                onClick={() => {
                  console.log('Current user premium status:', user?.is_premium);
                  console.log('User ID:', user?.id);
                  alert(`Current status: ${user?.is_premium ? 'Premium' : 'Free'}\nUser ID: ${user?.id}`);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                Check Current Status
              </button>
            </div>
          </div>
        </div>
        
        {!user.is_premium && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Manual Premium Upgrade</h3>
                <p className="text-blue-700">For testing: manually upgrade to premium status</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const { supabase } = await import('../lib/supabase');
                    const { error } = await supabase
                      .from('users')
                      .update({ is_premium: true })
                      .eq('id', user.id);
                    
                    if (error) {
                      console.error('Error updating premium status:', error);
                      alert('Failed to update premium status');
                    } else {
                      console.log('✅ Manually updated to premium');
                      await refreshUser();
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to update premium status');
                  }
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700"
              >
                Manually Upgrade to Premium
                   console.log('🚨 Showing error to user:', errorMessage);
                   
                   // Show error on page instead of alert
                   setError(`❌ Test failed: ${errorMessage}`);
            </div>
          </div>
        )}

        {/* Header */}
            </button>
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Welcome back, {user.name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Track your progress and continue your SAT Math journey
              </p>
            </div>
            {user.is_premium && (
              <div className="flex items-center bg-gradient-primary text-white px-4 py-2 rounded-full">
                <Star className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Premium</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.totalQuestionsAnswered || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getAccuracyPercentage()}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(progress?.totalTimeSpentSeconds || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.currentStreak || 0} days
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topic Mastery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                  Topic Mastery
                </h2>
                <Link 
                  to="/practice" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Practice More →
                </Link>
              </div>

              {topicMastery.length > 0 ? (
                <div className="space-y-4">
                  {topicMastery.map((topic, index) => (
                    <div key={topic.topic} className="animate-slide-up" style={{ animationDelay: `${0.1 * index}s` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                        <span className="text-sm font-bold text-gray-900">{topic.masteryPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="progress-bar h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${topic.masteryPercentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Start practicing to see your topic mastery!</p>
                  <Link 
                    to="/practice" 
                    className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Begin Practice <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-lg animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-green-600" />
                Recent Sessions
              </h2>

              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session, index) => (
                    <div 
                      key={session.id} 
                      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{session.topic}</span>
                        <span className="text-xs text-gray-500">{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {session.score}/{session.total} correct
                        </span>
                        <span className="text-gray-600">
                          {formatTime(session.timeSpent)}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(session.score / session.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No practice sessions yet</p>
                  <Link 
                    to="/practice" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Start Your First Session <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/practice"
            className="group bg-gradient-primary text-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Start Practice</h3>
                <p className="text-white/80 text-sm">Begin a new practice session</p>
              </div>
              <Zap className="h-8 w-8 group-hover:animate-bounce" />
            </div>
          </Link>

          <Link
            to="/learn"
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in"
            style={{ animationDelay: '0.7s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Learn Concepts</h3>
                <p className="text-gray-600 text-sm">Review math concepts and strategies</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          {!user.is_premium && (
            <Link
              to="/upgrade"
              className="group bg-gradient-warm text-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in"
              style={{ animationDelay: '0.8s' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Upgrade to Premium</h3>
                  <p className="text-white/80 text-sm">Unlock all 300 questions</p>
                </div>
                <Star className="h-8 w-8 group-hover:animate-pulse" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;