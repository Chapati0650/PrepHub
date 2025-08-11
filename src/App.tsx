import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Check, X, ArrowRight, ArrowLeft, RotateCcw, Eye, Home } from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { useQuestions } from '../contexts/QuestionContext';

interface QuestionData {
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  options: string[];
  correctAnswer: number;
  correctAnswerText: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

// Separate Review Component
const ReviewMode = ({ 
  questions, 
  answers, 
  openEndedAnswers, 
  onExit 
}: {
  questions: QuestionData[];
  answers: (number | null)[];
  openEndedAnswers: string[];
  onExit: () => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();

  const isAnswerCorrect = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.questionType === 'multiple_choice') {
      return answers[questionIndex] === question.correctAnswer;
    } else {
      return openEndedAnswers[questionIndex] === question.correctAnswerText;
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-purple-900">
                Review Mode: Question {currentQuestion + 1} of {questions.length}
              </h1>
              <p className="text-purple-700">
                <span className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                  isAnswerCorrect(currentQuestion) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isAnswerCorrect(currentQuestion) ? 'Correct' : 'Incorrect'}
                </span>
              </p>
            </div>
            <button
              onClick={onExit}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Exit Review
            </button>
          </div>
          
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
                {question.options.map((option, index) => {
                  const isUserAnswer = answers[currentQuestion] === index;
                  const isCorrectAnswer = index === question.correctAnswer;
                  const isUserCorrect = answers[currentQuestion] === question.correctAnswer;
                  
                  let buttonClass = '';
                  let iconElement = null;
                  
                  if (isCorrectAnswer) {
                    buttonClass = 'border-green-500 bg-green-50 text-green-700';
                    iconElement = <Check className="h-5 w-5 text-green-600" />;
                  } else if (isUserAnswer && !isUserCorrect) {
                    buttonClass = 'border-red-500 bg-red-50 text-red-700';
                    iconElement = <X className="h-5 w-5 text-red-600" />;
                  } else {
                    buttonClass = 'border-gray-200 bg-gray-50 text-gray-600';
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${buttonClass} cursor-default`}
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-2 ${
                  openEndedAnswers[currentQuestion] === question.correctAnswerText
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-center mb-2">
                    {openEndedAnswers[currentQuestion] === question.correctAnswerText ? (
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className="font-semibold">Your Answer:</span>
                  </div>
                  <p className="text-lg font-mono">
                    {openEndedAnswers[currentQuestion] || 'No answer provided'}
                  </p>
                </div>
                
                {openEndedAnswers[currentQuestion] !== question.correctAnswerText && (
                  <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
                    <div className="flex items-center mb-2">
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">Correct Answer:</span>
                    </div>
                    <p className="text-lg font-mono text-green-700">
                      {question.correctAnswerText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation Section - Always shown in review mode */}
          <div className="border-t pt-4">
            <div className="space-y-4">
              {/* Answer Status */}
              <div className={`p-4 rounded-lg ${
                isAnswerCorrect(currentQuestion)
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {isAnswerCorrect(currentQuestion) ? (
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <X className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className="font-semibold">
                    {isAnswerCorrect(currentQuestion) ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                
                {/* Show correct answer for incorrect responses */}
                {!isAnswerCorrect(currentQuestion) && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Correct answer:</strong> {question.questionType === 'multiple_choice' 
                      ? `${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}`
                      : question.correctAnswerText}
                  </p>
                )}
              </div>
              
              {/* Explanation */}
              {question.explanation && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800">
                    <MathRenderer>{question.explanation}</MathRenderer>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestion === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/practice')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Practice Again</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestion === questions.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionGenerator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { generateQuestions, savePracticeSession } = useQuestions();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [openEndedAnswers, setOpenEndedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTotalTime, setInitialTotalTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [score, setScore] = useState(0);

  const settings = location.state || {
    topic: 'Algebra',
    difficulty: 'medium',
    questionCount: 10,
    timedMode: false,
    customTimePerQuestion: 2
  };

  useEffect(() => {
    const loadQuestions = async () => {
      const generatedQuestions = await generateQuestions(settings);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
      setOpenEndedAnswers(new Array(generatedQuestions.length).fill(''));
      
      if (settings.timedMode) {
        const totalTime = generatedQuestions.length * (settings.customTimePerQuestion * 60);
        setTimeLeft(totalTime);
        setInitialTotalTime(totalTime);
      }
    };

    loadQuestions();
  }, [settings]);

  useEffect(() => {
    if (settings.timedMode && timeLeft > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isComplete, settings.timedMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleOpenEndedAnswer = (answer: string) => {
    setOpenEndedAnswer(answer);
    const newAnswers = [...openEndedAnswers];
    newAnswers[currentQuestion] = answer;
    setOpenEndedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
      setOpenEndedAnswer(openEndedAnswers[currentQuestion + 1] || '');
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setOpenEndedAnswer(openEndedAnswers[currentQuestion - 1] || '');
      setShowExplanation(false);
    }
  };

  const handleComplete = () => {
    const correctAnswers = questions.filter((question, index) => {
      if (question.questionType === 'multiple_choice') {
        return answers[index] === question.correctAnswer;
      } else {
        return openEndedAnswers[index] === question.correctAnswerText;
      }
    });
    
    setScore(correctAnswers.length);
    savePracticeSessionToDb();
    setIsComplete(true);
  };

  const isAnswerCorrect = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.questionType === 'multiple_choice') {
      return answers[questionIndex] === question.correctAnswer;
    } else {
      return openEndedAnswers[questionIndex] === question.correctAnswerText;
    }
  };

  const handleStartReview = () => {
    console.log('🔍 Starting review mode...');
    setIsReviewMode(true);
  };

  const handleExitReview = () => {
    console.log('🚪 Exiting review mode...');
    setIsReviewMode(false);
  };

  const savePracticeSessionToDb = async () => {
    try {
      const correctAnswers = questions.filter((question, index) => {
        if (question.questionType === 'multiple_choice') {
          return answers[index] === question.correctAnswer;
        } else {
          return openEndedAnswers[index] === question.correctAnswerText;
        }
      });

      const timeSpent = settings.timedMode 
        ? initialTotalTime - timeLeft
        : 0;

      await savePracticeSession({
        topic: settings.topic === 'Mixed' ? 'Mixed Skills' : settings.topic,
        difficulty: settings.difficulty,
        totalQuestions: questions.length,
        correctAnswers: correctAnswers.length,
        timeSpentSeconds: timeSpent
      });
    } catch (error) {
      console.error('Failed to save practice session:', error);
    }
  };

  const handleRestart = () => {
    navigate('/practice');
  };

  // Show review mode if active
  if (isReviewMode) {
    return (
      <ReviewMode
        questions={questions}
        answers={answers}
        openEndedAnswers={openEndedAnswers}
        onExit={handleExitReview}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generating your practice questions...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-8">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                percentage >= 80 ? 'bg-green-100 text-green-600' :
                percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <span className="text-2xl font-bold">{percentage}%</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Practice Complete!
              </h1>
              <p className="text-lg text-gray-600">
                You scored {score} out of {questions.length} questions correctly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Topic</h3>
                <p className="text-blue-700">{settings.topic}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">Difficulty</h3>
                <p className="text-purple-700 capitalize">{settings.difficulty}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Questions</h3>
                <p className="text-green-700">{questions.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartReview}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <Eye className="h-5 w-5 mr-2" />
                Review Answers
              </button>
              <button
                onClick={handleRestart}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Practice Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {settings.topic} - {settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}
              </h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            
            {settings.timedMode && (
              <div className="flex items-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className={`font-mono font-semibold ${
                  timeLeft < 60 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
                {question.options.map((option, index) => {
                  const buttonClass = selectedAnswer === index
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300';
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${buttonClass} cursor-pointer`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
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
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-teal-600 focus:outline-none text-center text-lg font-medium"
                  placeholder="Enter number (e.g., 42, 3.14, -5)"
                />
              </div>
            )}
          </div>

          {/* Explanation Section */}
          {((question.questionType === 'multiple_choice' && selectedAnswer !== null) || 
           (question.questionType === 'open_ended' && openEndedAnswer.trim() !== '')) && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-teal-600 hover:text-teal-700 font-medium mb-3"
              >
                {showExplanation ? 'Hide Answer' : 'Check Answer'}
              </button>
              
              {showExplanation && (
                <div className="space-y-4">
                  {/* Answer Status */}
                  <div className={`p-4 rounded-lg ${
                    isAnswerCorrect(currentQuestion)
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      {isAnswerCorrect(currentQuestion) ? (
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className="font-semibold">
                        {isAnswerCorrect(currentQuestion) ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    
                    {/* Show correct answer for incorrect responses */}
                    {!isAnswerCorrect(currentQuestion) && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>Correct answer:</strong> {question.questionType === 'multiple_choice' 
                          ? `${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}`
                          : question.correctAnswerText}
                      </p>
                    )}
                  </div>
                  
                  {/* Explanation */}
                  {question.explanation && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                      <p className="text-blue-800">
                        <MathRenderer>{question.explanation}</MathRenderer>
                      </p>
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
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestion === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleComplete}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Complete Practice
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionGenerator;