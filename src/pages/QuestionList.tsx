import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Circle, BookOpen, Target, Filter, ArrowLeft } from 'lucide-react';
import { useQuestions } from '../contexts/QuestionContext';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  topic: string;
  difficulty: string;
  questionType: 'multiple_choice' | 'open_ended';
  isCompleted?: boolean;
}

const QuestionList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuestionsList } = useQuestions();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get settings from navigation state
  const settings = location.state || {
    topic: '',
    difficulty: 'hard'
  };

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const questionsList = await getQuestionsList(settings.topic, settings.difficulty);
        setQuestions(questionsList);
        
        console.log(`✅ Loaded ${questionsList.length} questions for topic: ${settings.topic || 'Mixed Skills'}`);
      } catch (err) {
        console.error('❌ Error loading questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [settings.topic, settings.difficulty, getQuestionsList]);

  const handleQuestionClick = (questionId: string) => {
    navigate(`/question/${questionId}`, {
      state: {
        topic: settings.topic,
        difficulty: settings.difficulty,
        returnTo: '/questions'
      }
    });
  };

  const completedCount = questions.filter(q => q.isCompleted).length;
  const totalCount = questions.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Questions</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/practice')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Practice Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/practice')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Practice Setup
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {completedCount} of {totalCount} completed
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-sm font-medium text-gray-900">
                {progressPercentage}%
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {settings.topic || 'Mixed Skills'}
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Practice Questions
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Click on any question to start practicing. Your progress is automatically saved.
            </p>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h2>
            <p className="text-gray-600 mb-6">
              No questions found for the selected topic and difficulty level.
            </p>
            <button
              onClick={() => navigate('/practice')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Different Settings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => handleQuestionClick(question.id)}
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg animate-scale-in ${
                  question.isCompleted
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {question.isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Question {question.questionNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {question.topic} • {question.questionType === 'multiple_choice' ? 'Multiple Choice' : 'Open Ended'}
                      </p>
                    </div>
                  </div>
                  
                  <Play className={`h-5 w-5 transition-all duration-300 ${
                    question.isCompleted 
                      ? 'text-green-600' 
                      : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1'
                  }`} />
                </div>

                <div className="text-gray-700 text-sm line-clamp-3 mb-4">
                  {question.question.length > 120 
                    ? `${question.question.substring(0, 120)}...` 
                    : question.question}
                </div>

                <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                  question.isCompleted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-800'
                }`}>
                  {question.isCompleted ? 'Completed' : 'Not Started'}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {questions.length > 0 && (
          <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-6 w-6 mr-3 text-blue-600" />
              Progress Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{completedCount}</div>
                <div className="text-gray-600">Questions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{totalCount - completedCount}</div>
                <div className="text-gray-600">Questions Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{progressPercentage}%</div>
                <div className="text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionList;