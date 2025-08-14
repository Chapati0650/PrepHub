import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuestions } from '../contexts/QuestionContext';
import { supabase } from '../lib/supabase';

interface UserProgress {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  lastPracticeDate: string | null;
}

interface RecentSession {
  id: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  sessionDate: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getUserProgress, getRecentSessions, getQuestionsCount } = useQuestions();
  
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [totalQuestionsAvailable, setTotalQuestionsAvailable] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [progress, sessions, questionsCount] = await Promise.all([
          getUserProgress(),
          getRecentSessions(),
          getQuestionsCount()
        ]);
        
        setUserProgress(progress);
        setRecentSessions(sessions);
        setTotalQuestionsAvailable(questionsCount);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, authLoading, navigate, getUserProgress, getRecentSessions, getQuestionsCount]);

  // Add effect to refresh data when returning from practice
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 Page became visible, refreshing dashboard data...');
        // Add a small delay to ensure any database updates have completed
        setTimeout(() => {
        const loadDashboardData = async () => {
          try {
            const [progress, sessions, questionsCount] = await Promise.all([
              getUserProgress(),
              getRecentSessions(),
              getQuestionsCount()
            ]);
            
            setUserProgress(progress);
            setRecentSessions(sessions);
            setTotalQuestionsAvailable(questionsCount);
            setLastRefresh(Date.now());
          } catch (error) {
            console.error('Error refreshing dashboard data:', error);
          }
        };
        loadDashboardData();
        }, 1000); // Wait 1 second for database updates to complete
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, getUserProgress, getRecentSessions, getQuestionsCount]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const accuracyPercentage = userProgress?.totalQuestionsAnswered 
    ? Math.round((userProgress.totalCorrectAnswers / userProgress.totalQuestionsAnswered) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome back,
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              {user?.name || user?.email?.split('@')[0] || 'Student'}
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Track your progress and continue your SAT Math journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-scale-in">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Mastered</p>
                <p className="text-2xl font-bold text-gray-900">{userProgress?.totalQuestionsAnswered || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{accuracyPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(userProgress?.totalTimeSpentSeconds || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{userProgress?.currentStreak || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Questions Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-scale-in">
            <div className="flex items-center mb-6">
              <Target className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Questions Progress</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Questions Mastered</span>
                <span className="text-lg font-bold text-gray-900">{userProgress?.totalQuestionsAnswered || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Questions Left to Master</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.max(0, totalQuestionsAvailable - (userProgress?.totalQuestionsAnswered || 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Available</span>
                <span className="text-lg font-bold text-gray-900">{totalQuestionsAvailable}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((userProgress?.totalQuestionsAnswered || 0) / Math.max(1, totalQuestionsAvailable)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-primary h-3 rounded-full transition-all duration-500 progress-bar"
                    style={{ width: `${Math.min(100, ((userProgress?.totalQuestionsAnswered || 0) / Math.max(1, totalQuestionsAvailable)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            </div>
            
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.topic}</p>
                      <p className="text-sm text-gray-600">
                        {session.correctAnswers}/{session.totalQuestions} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round((session.correctAnswers / session.totalQuestions) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(session.sessionDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No practice sessions yet</p>
                <button
                  onClick={() => navigate('/practice')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Practicing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/practice')}
              className="bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <Zap className="h-6 w-6 mr-3" />
              Start Practice Session
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
            >
              <BookOpen className="h-6 w-6 mr-3" />
              Learn Concepts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;