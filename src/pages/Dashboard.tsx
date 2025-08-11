import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  BarChart3,
  Target,
  Zap
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
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  sessionDate: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { getUserProgress, getTopicMastery, getRecentSessions } = useQuestions();
  
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [progress, mastery, sessions] = await Promise.all([
          getUserProgress(),
          getTopicMastery(),
          getRecentSessions()
        ]);
        
        setUserProgress(progress);
        setTopicMastery(mastery);
        setRecentSessions(sessions);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, authLoading, navigate, getUserProgress, getTopicMastery, getRecentSessions]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  const getAccuracyPercentage = () => {
    if (!userProgress || userProgress.totalQuestionsAnswered === 0) return 0;
    return Math.round((userProgress.totalCorrectAnswers / userProgress.totalQuestionsAnswered) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and continue learning</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress?.totalQuestionsAnswered || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getAccuracyPercentage()}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Practiced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(userProgress?.totalTimeSpentSeconds || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress?.currentStreak || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Topic Mastery */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Topic Mastery</h2>
            </div>
            
            {topicMastery.length > 0 ? (
              <div className="space-y-4">
                {topicMastery.map((topic) => (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                      <span className="text-sm font-bold text-gray-900">{topic.masteryPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${topic.masteryPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Start practicing to see your topic mastery</p>
                <button
                  onClick={() => navigate('/practice')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Practicing
                </button>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            </div>
            
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.topic}</p>
                      <p className="text-sm text-gray-600">
                        {session.correctAnswers}/{session.totalQuestions} correct • {session.difficulty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round((session.correctAnswers / session.totalQuestions) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No practice sessions yet</p>
                <button
                  onClick={() => navigate('/practice')}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Your First Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/practice')}
              className="flex items-center justify-center p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
            >
              <BookOpen className="h-8 w-8 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-blue-900">Start Practice</p>
                <p className="text-sm text-blue-700">Begin a new practice session</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/learn')}
              className="flex items-center justify-center p-6 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-colors group"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-purple-900">Learn</p>
                <p className="text-sm text-purple-700">Study concepts and formulas</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/upgrade')}
              className="flex items-center justify-center p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors group"
            >
              <Award className="h-8 w-8 text-yellow-600 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-yellow-900">Upgrade</p>
                <p className="text-sm text-yellow-700">Unlock premium features</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;