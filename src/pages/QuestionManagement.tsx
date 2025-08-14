import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Eye, EyeOff, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MathRenderer from '../components/MathRenderer';

interface Question {
  id: string;
  question_number: number;
  question: string;
  question_type: 'multiple_choice' | 'open_ended';
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  explanation: string | null;
  topic: string;
  difficulty: string;
  access_level: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const QuestionManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Check if user is admin
  useEffect(() => {
    if (!user || user.email !== 'rptestprepservices@gmail.com') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('questions')
        .select('*')
        .order('question_number', { ascending: true });

      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setMessage('Failed to load questions');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [showInactive]);

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', questionId);

      if (error) throw error;

      setMessage('Question deactivated successfully');
      setMessageType('success');
      setDeleteConfirm(null);
      loadQuestions();
    } catch (error) {
      console.error('Error deactivating question:', error);
      setMessage('Failed to deactivate question');
      setMessageType('error');
    }
  };

  const handleRestoreQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: true })
        .eq('id', questionId);

      if (error) throw error;

      setMessage('Question restored successfully');
      setMessageType('success');
      loadQuestions();
    } catch (error) {
      console.error('Error restoring question:', error);
      setMessage('Failed to restore question');
      setMessageType('error');
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.question_number.toString().includes(searchTerm);
    const matchesTopic = !selectedTopic || question.topic === selectedTopic;
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty;
    const matchesAccessLevel = !selectedAccessLevel || question.access_level === selectedAccessLevel;

    return matchesSearch && matchesTopic && matchesDifficulty && matchesAccessLevel;
  });

  const topics = ['Algebra', 'Advanced Math', 'Problem Solving and Data Analysis', 'Geo/Trig'];
  const difficulties = ['easy', 'medium', 'hard'];
  const accessLevels = ['free', 'premium'];

  if (!user || user.email !== 'rptestprepservices@gmail.com') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Question Management</h1>
          <p className="text-gray-600">View, search, and manage questions in the database</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions or question number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Topic Filter */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            {/* Access Level Filter */}
            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Access Levels</option>
              {accessLevels.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show inactive questions</span>
            </label>
            
            <div className="text-sm text-gray-600">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`bg-white rounded-xl shadow-lg border transition-all duration-300 ${
                  question.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
                }`}
              >
                {/* Question Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">
                        #{question.question_number}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.topic === 'Algebra' ? 'bg-blue-100 text-blue-800' :
                          question.topic === 'Advanced Math' ? 'bg-purple-100 text-purple-800' :
                          question.topic === 'Problem Solving and Data Analysis' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {question.topic}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.access_level === 'free' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {question.access_level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Open Ended'}
                        </span>
                        {!question.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedQuestion(
                          expandedQuestion === question.id ? null : question.id
                        )}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {expandedQuestion === question.id ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      
                      {question.is_active ? (
                        <button
                          onClick={() => setDeleteConfirm(question.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreQuestion(question.id)}
                          className="text-green-500 hover:text-green-700 transition-colors text-sm font-medium"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Question Preview */}
                  <div className="mt-4">
                    <div className="text-gray-900 font-medium line-clamp-2">
                      <MathRenderer>{question.question}</MathRenderer>
                    </div>
                  </div>
                </div>

                {/* Expanded Question Details */}
                {expandedQuestion === question.id && (
                  <div className="p-6 bg-gray-50">
                    <div className="space-y-6">
                      {/* Full Question */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Question:</h4>
                        <div className="bg-white p-4 rounded-lg border">
                          <MathRenderer>{question.question}</MathRenderer>
                        </div>
                      </div>

                      {/* Question Image */}
                      {question.image_url && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Question Image:</h4>
                          <img
                            src={question.image_url}
                            alt="Question"
                            className="max-w-full h-auto max-h-64 rounded border border-gray-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Options (for multiple choice) */}
                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Options:</h4>
                          <div className="space-y-2">
                            {['A', 'B', 'C', 'D'].map((letter, index) => {
                              const optionText = question[`option_${letter.toLowerCase()}` as keyof Question] as string;
                              if (!optionText) return null;
                              
                              return (
                                <div
                                  key={letter}
                                  className={`p-3 rounded border ${
                                    question.correct_answer === letter 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium">{letter}.</span>
                                    <div className="flex-1">
                                      <MathRenderer>{optionText}</MathRenderer>
                                    </div>
                                    {question.correct_answer === letter && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer (for open ended) */}
                      {question.question_type === 'open_ended' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Correct Answer:</h4>
                          <div className="bg-green-50 border border-green-200 p-3 rounded">
                            <span className="font-mono text-lg">{question.correct_answer}</span>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Explanation:</h4>
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                            <MathRenderer>{question.explanation}</MathRenderer>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <p className="text-gray-600">
                            {new Date(question.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p className="text-gray-600">
                            {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Open Ended'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <p className={question.is_active ? 'text-green-600' : 'text-red-600'}>
                            {question.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ID:</span>
                          <p className="text-gray-600 font-mono text-xs">{question.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredQuestions.length === 0 && !loading && (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No questions found matching your filters</p>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            
            <div className="relative bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Deactivate Question?
                </h3>
                
                <p className="text-gray-600 mb-8">
                  This will deactivate the question and remove it from practice sessions. 
                  You can restore it later if needed.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(deleteConfirm)}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManagement;