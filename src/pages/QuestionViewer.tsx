import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, ArrowLeft, Home, List, Eye, EyeOff } from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { useQuestions } from '../contexts/QuestionContext';

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
  explanation: string | null;
  topic: string;
  difficulty: string;
  questionType: 'multiple_choice' | 'open_ended';
  imageUrl: string | null;
  isCompleted?: boolean;
}

const QuestionViewer = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuestionById, recordQuestionAttempt } = useQuestions();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get settings from navigation state
  const settings = location.state || {
    topic: '',
    difficulty: 'hard',
    returnTo: '/practice'
  };

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) {
        setError('No question ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const questionData = await getQuestionById(questionId);
        
        if (!questionData) {
          setError('Question not found');
          return;
        }

        setQuestion(questionData);
        setHasAnswered(questionData.isCompleted || false);
        
        console.log('✅ Question loaded successfully');
      } catch (err) {
        console.error('❌ Error loading question:', err);
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, getQuestionById]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerIndex);
  };

  const handleOpenEndedAnswer = (answer: string) => {
    if (hasAnswered) return;
    setOpenEndedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!question || hasAnswered) return;

    let isCorrect = false;
    
    if (question.questionType === 'multiple_choice') {
      if (selectedAnswer === null) return;
      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
      isCorrect = selectedAnswer === correctIndex;
    } else {
      if (!openEndedAnswer.trim()) return;
      isCorrect = openEndedAnswer.trim() === question.correctAnswer;
    }

    try {
      await recordQuestionAttempt(question.id, isCorrect);
      setHasAnswered(true);
      setShowExplanation(true);
      
      // Update the question's completion status
      setQuestion(prev => prev ? { ...prev, isCompleted: isCorrect } : null);
      
      console.log('✅ Answer submitted and recorded');
    } catch (err) {
      console.error('❌ Error recording answer:', err);
      // Still allow showing explanation even if recording fails
      setHasAnswered(true);
      setShowExplanation(true);
    }
  };

  const isAnswerCorrect = () => {
    if (!question) return false;
    
    if (question.questionType === 'multiple_choice') {
      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
      return selectedAnswer === correctIndex;
    } else {
      return openEndedAnswer.trim() === question.correctAnswer;
    }
  };

  const getCorrectAnswerText = () => {
    if (!question) return '';
    
    if (question.questionType === 'multiple_choice') {
      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
      const options = [question.optionA, question.optionB, question.optionC, question.optionD];
      return `${question.correctAnswer} - ${options[correctIndex]}`;
    } else {
      return question.correctAnswer;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error || 'Question not found'}</p>
            <button
              onClick={() => navigate(settings.returnTo)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-slide-up">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Question {question.questionNumber}
              </h1>
              <p className="text-gray-600">
                {question.topic} • {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)} • {question.questionType === 'multiple_choice' ? 'Multiple Choice' : 'Open Ended'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {question.isCompleted && (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
              
              <button
                onClick={() => navigate('/questions', { state: settings })}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                <List className="h-4 w-4" />
                <span>Question List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-scale-in">
          <div className="mb-6">
            <div className="text-lg font-medium text-gray-900 mb-4 font-sans">
              <MathRenderer>{question.question}</MathRenderer>
            </div>
            
            {/* Display question image if available */}
            {question.imageUrl && question.imageUrl.trim() !== '' && question.imageUrl !== 'null' && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Question Image:</p>
                <img
                  src={question.imageUrl}
                  alt="Question diagram"
                  className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 shadow-sm mx-auto block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {question.questionType === 'multiple_choice' ? (
              <div className="space-y-3">
                {[question.optionA, question.optionB, question.optionC, question.optionD].map((option, index) => {
                  if (!option) return null;
                  
                  const isSelected = selectedAnswer === index;
                  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
                  const isCorrectAnswer = index === correctIndex;
                  
                  let buttonClass = '';
                  let iconElement = null;
                  
                  if (hasAnswered && showExplanation) {
                    if (isCorrectAnswer) {
                      buttonClass = 'border-green-500 bg-green-50 text-green-700';
                      iconElement = <Check className="h-5 w-5 text-green-600" />;
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonClass = 'border-red-500 bg-red-50 text-red-700';
                      iconElement = <X className="h-5 w-5 text-red-600" />;
                    } else {
                      buttonClass = 'border-gray-200 bg-gray-50 text-gray-600';
                    }
                  } else {
                    buttonClass = isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300';
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${buttonClass} ${
                        hasAnswered ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {iconElement}
                        </div>
                        <div className="flex-1">
                          {(option.startsWith('http') || option.startsWith('https://')) && 
                           (option.includes('.jpg') || option.includes('.png') || option.includes('.gif') || 
                            option.includes('.svg') || option.includes('.jpeg') || option.includes('.webp') || 
                            option.includes('supabase') || option.includes('storage')) ? (
                            <img
                              src={option}
                              alt="Option"
                              className="max-w-full h-auto max-h-48 rounded border border-gray-300 shadow-sm"
                              onError={(e) => {
                                e.currentTarget.outerHTML = `<div class="text-red-500 text-sm">Image failed to load</div>`;
                              }}
                            />
                          ) : (
                            <MathRenderer inline>{option}</MathRenderer>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your numeric answer:
                </label>
                <input
                  type="text"
                  value={openEndedAnswer}
                  onChange={(e) => handleOpenEndedAnswer(e.target.value)}
                  disabled={hasAnswered}
                  className={`w-full p-4 border-2 rounded-lg focus:outline-none text-center text-lg font-medium transition-all ${
                    hasAnswered
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : 'border-gray-200 focus:border-blue-600'
                  }`}
                  placeholder="Enter number (e.g., 42, 3.14, -5)"
                />
              </div>
            )}
          </div>

          {/* Submit/Check Answer Button */}
          {!hasAnswered && (
            <div className="border-t pt-6">
              <button
                onClick={handleSubmitAnswer}
                disabled={
                  (question.questionType === 'multiple_choice' && selectedAnswer === null) ||
                  (question.questionType === 'open_ended' && !openEndedAnswer.trim())
                }
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Explanation Section */}
          {hasAnswered && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Answer & Explanation</h3>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {showExplanation ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              {showExplanation && (
                <div className="space-y-4">
                  {/* Answer Status */}
                  <div className={`p-4 rounded-lg ${
                    isAnswerCorrect()
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      {isAnswerCorrect() ? (
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className="font-semibold">
                        {isAnswerCorrect() ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    
                    {/* Show correct answer for incorrect responses */}
                    {!isAnswerCorrect() && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>Correct answer:</strong> {getCorrectAnswerText()}
                      </p>
                    )}
                  </div>
                  
                  {/* Explanation */}
                  {question.explanation && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                      <div className="text-blue-800">
                        <MathRenderer>{question.explanation}</MathRenderer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/questions', { state: settings })}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Questions</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/questions', { state: settings })}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <span>Next Question</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionViewer;