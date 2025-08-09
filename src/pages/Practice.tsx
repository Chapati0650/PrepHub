import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, BookOpen, Play, Zap, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Practice = () => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  // Persist timedMode and time settings in localStorage
  const [timedMode, setTimedMode] = useState<boolean>(() => {
    const v = localStorage.getItem('timedMode');
    return v ? JSON.parse(v) : false;
  });

  // Backward-compat field (minutes). Keep but derive from unified controls below.
  const [customTimePerQuestion, setCustomTimePerQuestion] = useState<number>(() => {
    const v = localStorage.getItem('timeValue');
    const unit = localStorage.getItem('timeUnit') || 'min';
    const num = v ? Number(v) : 2;
    return unit === 'sec' ? Math.max(0.5, num / 60) : Math.max(0.5, num);
  });

  // New unified time controls (value + unit)
  const [timeValue, setTimeValue] = useState<number>(() => {
    const v = localStorage.getItem('timeValue');
    return v ? Number(v) : 2; // default 2 minutes
  });
  const [timeUnit, setTimeUnit] = useState<'min' | 'sec'>(() => {
    const v = localStorage.getItem('timeUnit');
    return v === 'sec' ? 'sec' : 'min';
  });

  // Derived seconds per question
  const secondsPerQuestion = useMemo(() => {
    const v = Number.isFinite(timeValue) ? Math.max(0.5, timeValue) : 2;
    return timeUnit === 'min' ? Math.round(v * 60) : Math.round(v);
  }, [timeValue, timeUnit]);

  // Keep customTimePerQuestion (minutes) updated for any downstream code that still uses it
  useEffect(() => {
    setCustomTimePerQuestion(secondsPerQuestion / 60);
  }, [secondsPerQuestion]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('timedMode', JSON.stringify(timedMode));
  }, [timedMode]);
  useEffect(() => {
    localStorage.setItem('timeValue', String(timeValue));
  }, [timeValue]);
  useEffect(() => {
    localStorage.setItem('timeUnit', timeUnit);
  }, [timeUnit]);

  // Get user from AuthContext to check premium status
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const topics = [
    {
      name: 'Algebra',
      description: 'Linear equations, quadratics, systems, inequalities',
      icon: '📐',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Advanced Math',
      description: 'Functions, polynomials, radicals, exponentials',
      icon: '🧮',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Problem Solving and Data Analysis',
      description: 'Statistics, probability, data interpretation',
      icon: '📊',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Geo/Trig',
      description: 'Geometry, trigonometry, coordinate geometry',
      icon: '📏',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleStartPractice = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    // Adjust question count based on user's premium status (use it!)
    const actualQuestionCount = user?.isPremium ? questionCount : Math.min(questionCount, 30);

    navigate('/generator', {
      state: {
        topic: selectedTopic || 'Mixed',
        difficulty: 'hard',
        questionCount: actualQuestionCount,
        timedMode,
        // New canonical value the generator can rely on:
        secondsPerQuestion,
        // Backward compatibility for any existing code reading minutes:
        customTimePerQuestion, // minutes
        timeUnit,              // 'min' | 'sec' (in case you want to display it later)
      },
    });
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-primary text-white text-sm font-medium mb-6">
            <Settings className="h-4 w-4 mr-2" />
            Customize Your Session
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Practice Session
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Setup
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Choose your preferences to generate a personalized SAT Math practice module
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skill Selection */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-scale-in shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-blue-300" />
                Select Skill Category
              </h2>
              
              <div className="bg-blue-500/20 border border-blue-300/30 rounded-2xl p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>All questions are HARD difficulty.</strong> Choose a specific skill or select "Mixed Skills" for questions from all categories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => setSelectedTopic('')}
                  className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    selectedTopic === ''
                      ? 'border-blue-400 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🎯</span>
                    <span className="text-gray-900 font-semibold">Mixed Skills</span>
                  </div>
                  <p className="text-gray-600 text-sm">Questions from all categories</p>
                  <ChevronRight className={`h-5 w-5 mt-2 transition-transform ${selectedTopic === '' ? 'text-blue-500 translate-x-1' : 'text-gray-400'}`} />
                </button>

                {topics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => setSelectedTopic(topic.name)}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      selectedTopic === topic.name
                        ? 'border-blue-400 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">{topic.icon}</span>
                      <span className="text-gray-900 font-semibold">{topic.name}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{topic.description}</p>
                    <ChevronRight className={`h-5 w-5 mt-2 transition-transform ${selectedTopic === topic.name ? 'text-blue-500 translate-x-1' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-scale-in shadow-lg" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3 text-green-300" />
                Number of Questions
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="text-2xl font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-xl min-w-[4rem] text-center">
                    {questionCount}
                  </span>
                </div>
                
                <div className="relative">
                  {/* Max questions based on premium status */}
                  {(() => {
                    const maxQuestions = user?.isPremium ? 300 : 30;
                    const fillPercent = ((questionCount - 1) / (20 - 1)) * 100;
                    return (
                      <>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          className="w-full appearance-none cursor-pointer range-slider"
                          style={{ '--fill-percent': `${fillPercent}%` } as React.CSSProperties}
                        />
                        <div className="flex justify-between text-gray-500 text-sm mt-2">
                          <span>1</span> {/* Min value */}
                          <span>10</span> {/* Midpoint of slider (1-20) */}
                          <span>20</span> {/* Max value of slider */}
                        </div>
                        {!user?.isPremium && (
                          <p className="mt-3 text-xs text-gray-500">
                            Free accounts capped at 30 questions. Premium unlocks 300.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                {/* Message for free users */}
                {!user?.isPremium && (
                  <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-2xl p-4 mt-6">
                    <p className="text-yellow-800 text-sm">
                      You are currently on a free account, limited to 30 questions. Upgrade to Premium to access all 300 questions!
                    </p>
                    <button
                      onClick={() => navigate('/upgrade')}
                      className="mt-3 bg-gradient-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timed Mode */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-scale-in shadow-lg" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-purple-300" />
                  <h2 className="text-2xl font-bold text-gray-900">Timed Mode</h2>
                </div>
                <button
                  onClick={() => setTimedMode(!timedMode)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                    timedMode ? 'bg-gradient-primary' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      timedMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <h1 className="text-gray-600 mb-4">
                {timedMode 
                  ? 'Practice with time limits to simulate test conditions'
                  : 'Practice at your own pace without time limits'}
              </h1>
              
              {timedMode && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 animate-slide-up">
                  <label className="block text-purple-800 font-medium mb-3">
                    Time per Question
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min={timeUnit === 'min' ? 0.5 : 30}
                        max={timeUnit === 'min' ? 10 : 600}
                        step={timeUnit === 'min' ? 0.5 : 10}
                        value={timeValue}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value > 0) {
                            setTimeValue(value);
                          }
                        }}
                        className="w-24 px-3 py-2 bg-white border border-purple-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-medium"
                      />
                      <div className="inline-flex rounded-lg overflow-hidden border border-purple-300">
                        <button
                          type="button"
                          onClick={() => setTimeUnit('min')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            timeUnit === 'min' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          min
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeUnit('sec')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            timeUnit === 'sec' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          sec
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-purple-100 rounded-lg p-3">
                      <div className="text-purple-800 text-sm mb-1">
                        <strong>Current setting:</strong> {timeValue} {timeUnit === 'min' ? 'minute' : 'second'}{timeValue !== 1 ? 's' : ''} per question
                      </div>
                      <div className="text-purple-700 text-xs">
                        Total session time: <strong>{Math.round((secondsPerQuestion * questionCount) / 60)} minutes</strong>
                      </div>
                    </div>
                    
                    <div className="text-purple-700 text-sm">
                      <strong>💡 Recommended:</strong> 2-3 minutes per question for optimal practice
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Session Summary */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 animate-scale-in shadow-lg" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Session Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Topic:</span>
                  <span className="text-gray-900 font-medium">
                    {selectedTopic || 'Mixed Skills'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions:</span>
                  <span className="text-gray-900 font-medium">{questionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="text-red-300 font-medium">Hard</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mode:</span>
                  <span className="text-gray-900 font-medium">
                    {timedMode
                      ? `Timed (${timeUnit === 'min' ? `${timeValue}m` : `${secondsPerQuestion}s`} / q)`
                      : 'Untimed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartPractice}
              className="w-full group bg-gradient-primary text-white py-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              Start Practice Session
              <Play className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </button>

            {error && (
              <div className="bg-red-500/20 border border-red-300/30 rounded-2xl p-4 animate-slide-up">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h4 className="text-gray-900 font-semibold mb-3">💡 Pro Tips</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Start with untimed practice to build confidence</li>
                <li>• Focus on one topic at a time for better retention</li>
                <li>• Review explanations even for correct answers</li>
                <li>• Practice regularly for consistent improvement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
