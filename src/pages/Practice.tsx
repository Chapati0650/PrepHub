import React, { useState, useEffect } from 'react';
import { Clock, Check, X, ArrowRight, ArrowLeft, RotateCcw, Eye, Home } from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { useQuestions } from '../contexts/QuestionContext';

interface QuestionData {
  id: string;
  questionType: 'multiple_choice' | 'open_ended';
  options: string[];
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Award, 
  Zap, 
  Star,
  Calendar,
  BarChart3,
  Play,
  Settings,
  Crown,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuestions } from '../contexts/QuestionContext';
import { getPremiumProduct } from '../stripe-config';
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
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const premiumProduct = getPremiumProduct();

  // Check for payment success and refresh user data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      console.log('🎉 Payment success detected, refreshing user data...');
      refreshUser().then(() => {
        // Force a page reload to ensure all components reflect the new premium status
        window.location.reload();
      });
    }
  }, [refreshUser]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        console.log('📊 Loading dashboard data...');
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

    loadDashboardData();
  }, [user, getUserProgress, getTopicMastery, getRecentSessions]);

  const handleUpgrade = async () => {
    if (!user?.id) return;
    
    setUpgradeLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: premiumProduct.priceId,
          userId: user.id
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManualUpgrade = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔧 Manual upgrade - updating user premium status...');
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Manual upgrade error:', error);
        alert('Failed to upgrade manually. Please try again.');
        return;
      }

      console.log('✅ Manual upgrade successful');
      alert('Manual upgrade successful! Refreshing page...');
      await refreshUser();
      window.location.reload();
    } catch (error) {
      console.error('❌ Manual upgrade error:', error);
      alert('Failed to upgrade manually. Please try again.');
    }
  };

  const handleTestWebhook = async () => {
    if (!user?.id) return;
    
    setTestWebhookLoading(true);
    try {
      console.log('🧪 Testing webhook logic...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Test webhook successful:', data);
        alert('Test webhook successful! Refreshing page...');
        await refreshUser();
        window.location.reload();
      } else {
        console.error('❌ Test webhook failed:', data);
        alert(`Test webhook failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      alert('Failed to test webhook. Please try again.');
    } finally {
      setTestWebhookLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getAccuracyPercentage = () => {
    if (!progress || progress.totalQuestionsAnswered === 0) return 0;
    return Math.round((progress.totalCorrectAnswers / progress.totalQuestionsAnswered) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your dashboard</h1>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-gray-600">
                Ready to continue your SAT Math journey?
              </p>
            </div>
            {user.is_premium && (
              <div className="hidden md:flex items-center bg-gradient-primary text-white px-4 py-2 rounded-full">
                <Crown className="h-5 w-5 mr-2" />
                <span className="font-semibold">{premiumProduct.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Premium Upgrade Banner */}
        {!user.is_premium && (
          <div className="bg-gradient-primary rounded-3xl p-6 md:p-8 mb-8 text-white animate-scale-in">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Unlock Your Full Potential
                </h2>
                <p className="text-lg text-white/90 mb-4">
                  Get unlimited access to all 300+ premium questions and advanced features
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>300+ Questions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Unlimited Practice</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Advanced Analytics</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[200px]"
                >
                  {upgradeLoading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Star className="h-5 w-5 mr-2" />
                      Upgrade Now - ${premiumProduct.price}/mo
                    </>
                  )}
                </button>
                
                {/* Debug buttons - only show in development */}
                {import.meta.env.DEV && (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={handleManualUpgrade}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                    >
                      Manual Premium Upgrade
                    </button>
                    <button
                      onClick={handleTestWebhook}
                      disabled={testWebhookLoading}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                    >
                      {testWebhookLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test Webhook Logic'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats & Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-scale-in">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {progress?.totalQuestionsAnswered || 0}
                  </div>
                  <div className="text-sm text-gray-600">Questions Solved</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {getAccuracyPercentage()}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {progress ? formatTime(progress.totalTimeSpentSeconds) : '0m'}
                  </div>
                  <div className="text-sm text-gray-600">Time Practiced</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {progress?.currentStreak || 0}
                  </div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>

              {/* Topic Mastery */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Topic Mastery</h2>
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                </div>
                
                {topicMastery.length > 0 ? (
                  <div className="space-y-4">
                    {topicMastery.map((topic, index) => (
                      <div key={topic.topic} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{topic.topic}</span>
                          <span className="text-sm font-semibold text-gray-700">{topic.masteryPercentage}%</span>
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
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Start practicing to see your topic mastery!</p>
                  </div>
                )}
              </div>

              {/* Recent Sessions */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Practice Sessions</h2>
                  <Calendar className="h-5 w-5 text-gray-500" />
                </div>
                
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            (session.score / session.total) >= 0.8 ? 'bg-green-100 text-green-600' :
                            (session.score / session.total) >= 0.6 ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <Target className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{session.topic}</div>
                            <div className="text-sm text-gray-600 capitalize">{session.difficulty}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {session.score}/{session.total}
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round((session.score / session.total) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No practice sessions yet. Start practicing to see your history!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              {/* Quick Practice */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Practice</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/practice', { 
                      state: { 
                        topic: 'Mixed', 
                        difficulty: 'hard', 
                        questionCount: user.is_premium ? 20 : 10,
                        timedMode: false 
                      } 
                    })}
                    className="w-full bg-gradient-primary text-white p-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center group"
                  >
                    <Play className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                    Mixed Practice
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/practice')}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 p-4 rounded-2xl font-semibold hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Custom Practice
                  </button>
                </div>
              </div>

              {/* Learning Resources */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 animate-scale-in" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Resources</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/learn')}
                    className="w-full bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl font-semibold hover:bg-blue-100 transition-all duration-300 flex items-center justify-center"
                  >
                    <BookOpen className="h-5 w-5 mr-3" />
                    Video Tutorials
                  </button>
                </div>
              </div>

              {/* Achievement Badge */}
              {progress && progress.totalQuestionsAnswered > 0 && (
                <div className="bg-gradient-warm rounded-3xl p-6 text-white animate-scale-in" style={{ animationDelay: '0.5s' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">
                      {getAccuracyPercentage() >= 80 ? 'Math Master!' :
                       getAccuracyPercentage() >= 60 ? 'Getting Better!' :
                       'Keep Practicing!'}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {getAccuracyPercentage() >= 80 ? 'Outstanding accuracy! You\'re ready for the SAT!' :
                       getAccuracyPercentage() >= 60 ? 'Good progress! Keep up the momentum!' :
                       'Every question makes you stronger!'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;