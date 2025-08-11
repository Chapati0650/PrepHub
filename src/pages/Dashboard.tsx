import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  BookOpen,
  Zap,
  Trophy,
  Star,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuestions } from '../contexts/QuestionContext';

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
  const { user } = useAuth();
  const { getUserProgress, getTopicMastery, getRecentSessions } = useQuestions();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getAccuracyPercentage = () => {
    if (!progress || progress.totalQuestionsAnswered === 0) return 0;
    return Math.round((progress.totalCorrectAnswers / progress.totalQuestionsAnswered) * 100);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-green-600 bg-green-100';
    if (streak >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your dashboard</h1>
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-gray-600">
                Track your progress and continue your SAT Math journey
              </p>
            </div>
            {user.is_premium && (
              <div className="hidden md:flex items-center bg-gradient-primary text-white px-4 py-2 rounded-full">
                <Star className="h-4 w-4 mr-2" />
                <span className="font-medium">Premium Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">{progress?.totalQuestionsAnswered || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.is_premium 
                    ? Math.max(0, 300 - (progress?.totalQuestionsAnswered || 0))
                    : Math.max(0, 30 - (progress?.totalQuestionsAnswered || 0))
                  } remaining
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{getAccuracyPercentage()}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress?.totalCorrectAnswers || 0} correct
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{progress?.currentStreak || 0}</p>
                <p className="text-xs text-gray-500 mt-1">days in a row</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStreakColor(progress?.currentStreak || 0)}`}>
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Practiced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(progress?.totalTimeSpentSeconds || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">total time</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress & Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Question Progress Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-scale-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600" />
                Question Progress
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Overview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions Completed:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {progress?.totalQuestionsAnswered || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions Remaining:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {user?.is_premium 
                        ? Math.max(0, 300 - (progress?.totalQuestionsAnswered || 0))
                        : Math.max(0, 30 - (progress?.totalQuestionsAnswered || 0))
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Available:</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {user?.is_premium ? '300' : '30'} 
                      {!user?.is_premium && (
                        <span className="text-xs text-gray-500 ml-1">(free)</span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {Math.round(((progress?.totalQuestionsAnswered || 0) / (user?.is_premium ? 300 : 30)) * 100)}%
                    </div>
                    <p className="text-gray-600 text-sm">Progress Complete</p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="progress-bar h-4 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, ((progress?.totalQuestionsAnswered || 0) / (user?.is_premium ? 300 : 30)) * 100)}%` 
                      }}
                    />
                  </div>
                  
                  {!user?.is_premium && (progress?.totalQuestionsAnswered || 0) >= 25 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                      <p className="text-yellow-800 text-sm font-medium">
                        You're almost at your free limit! Upgrade to access all 300 questions.
                      </p>
                      <Link 
                        to="/upgrade"
                        className="inline-flex items-center mt-2 text-yellow-700 hover:text-yellow-800 font-semibold text-sm"
                      >
                        Upgrade Now <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-scale-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-3 text-purple-600" />
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/practice"
                  className="group bg-gradient-primary text-white p-6 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg mb-1">Start Practice</h3>
                    <p className="text-white/80 text-sm">Begin a new session</p>
                  </div>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/learn"
                  className="group bg-white border-2 border-gray-200 text-gray-900 p-6 rounded-2xl hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg mb-1">Learn Concepts</h3>
                    <p className="text-gray-600 text-sm">Watch video tutorials</p>
                  </div>
                  <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Topic Mastery */}
            {topicMastery.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-green-600" />
                  Topic Mastery
                </h2>
                
                <div className="space-y-4">
                  {topicMastery.map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{topic.topic}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${topic.masteryPercentage}%`,
                              animationDelay: `${index * 0.1}s`
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                          {topic.masteryPercentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recent Sessions */}
          <div className="space-y-8">
            {/* Recent Sessions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-scale-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-orange-600" />
                Recent Sessions
              </h2>
              
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session, index) => (
                    <div 
                      key={session.id}
                      className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{session.topic}</span>
                        <span className="text-xs text-gray-500">{session.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (session.score / session.total) >= 0.8 
                              ? 'bg-green-100 text-green-800'
                              : (session.score / session.total) >= 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {Math.round((session.score / session.total) * 100)}%
                          </span>
                          <span className="text-sm text-gray-600">
                            {session.score}/{session.total}
                          </span>
                        </div>
                        {session.timeSpent > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatTime(session.timeSpent)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No practice sessions yet</p>
                  <Link
                    to="/practice"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Start your first session
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Upgrade CTA for Free Users */}
            {!user.is_premium && (
              <div className="bg-gradient-primary rounded-2xl p-6 text-white animate-scale-in">
                <div className="text-center">
                  <Star className="h-8 w-8 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Unlock Premium</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Get access to all 300 questions and advanced features
                  </p>
                  <Link
                    to="/upgrade"
                    className="inline-flex items-center bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Upgrade Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            )}

            {/* Achievement Badge */}
            {progress && progress.totalQuestionsAnswered > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                  Achievement
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Getting Started</p>
                    <p className="text-sm text-gray-600">Completed your first practice session!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;