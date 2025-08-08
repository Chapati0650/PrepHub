import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Check, X, AlertCircle, Download, Image, Trash2, Lock, Unlock } from 'lucide-react';
import { useQuestions } from '../contexts/QuestionContext';
import { useAuth } from '../contexts/AuthContext';
import MathInput from '../components/MathInput';
import MathRenderer from '../components/MathRenderer';
import { ImageStorageService } from '../lib/imageStorage';
import { supabase } from '../lib/supabase';

interface UploadedQuestion {
  questionNumber?: number;
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  topic: string;
  difficulty: string;
  optionAImage?: string;
  optionBImage?: string;
  optionCImage?: string;
  optionDImage?: string;
}

const QuestionUpload = () => {
  const { user } = useAuth();
  const { uploadSingleQuestion, getQuestionsCount, getAllQuestions, deleteQuestion, isAdmin } = useQuestions();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<'multiple_choice' | 'open_ended'>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<'free' | 'premium'>('premium'); // New state for access level
  
  // Answer choice image states
  const [optionTypes, setOptionTypes] = useState<('text' | 'image')[]>(['text', 'text', 'text', 'text']);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);
  const [optionImagePreviews, setOptionImagePreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [optionImageUrls, setOptionImageUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [optionImageUploading, setOptionImageUploading] = useState<boolean[]>([false, false, false, false]);

  // Question management states
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const skills = [
    'Algebra',
    'Advanced Math',
    'Problem Solving and Data Analysis',
    'Geo/Trig'
  ];

  React.useEffect(() => {
    const loadCount = async () => {
      try {
        const count = await getQuestionsCount();
        setQuestionsCount(count);
      } catch (error) {
        console.error('Error loading questions count:', error);
        setQuestionsCount(0);
      }
    };
    loadCount();
  }, [getQuestionsCount]);

  const downloadTemplate = () => {
    const csvContent = selectedQuestionType === 'multiple_choice' 
      ? 'questionNumber,question,optionA,optionB,optionC,optionD,correctAnswer\n1,"Sample question?","Option A","Option B","Option C","Option D","A"'
      : 'questionNumber,question,correctAnswer\n1,"Sample question?","42"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedQuestionType}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Check if user is admin
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in with the admin account to access this page.</p>
          <p className="text-sm text-gray-500">Admin email: rptestprepservices@gmail.com</p>
          <Link 
            to="/login" 
            className="mt-4 inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">This page is restricted to the admin account only.</p>
          <p className="text-sm text-gray-500 mb-4">Current user: {user.email}</p>
          <p className="text-sm text-gray-500 mb-4">Required: rptestprepservices@gmail.com</p>
          <Link 
            to="/login" 
            className="inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  const canAddQuestion = () => {
    if (!selectedSkill || !selectedQuestionType || !questionText.trim() || !correctAnswer.trim()) {
      return false;
    }
    
    if (selectedQuestionType === 'multiple_choice') {
      return options.every(option => option.trim()) && ['A', 'B', 'C', 'D'].includes(correctAnswer);
    }
    
    return /^-?[0-9]+(\.[0-9]+)?$/.test(correctAnswer.trim());
  };

  const handleAddQuestion = async () => {
    if (!selectedSkill) {
      setErrorMessage('Please select a skill category before uploading');
      return;
    }

    if (!canAddQuestion()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setUploadStatus('processing');
    setErrorMessage('');
    
    try {
      console.log('Adding question with type:', selectedQuestionType);
      console.log('Options:', options);
      console.log('Correct answer:', correctAnswer);
      console.log('Image URL being saved:', imageUrl);
      
      const questionData = {
        questionNumber,
        question: questionText,
        questionType: selectedQuestionType,
        optionA: selectedQuestionType === 'multiple_choice' ? (options[0] || null) : null,
        optionB: selectedQuestionType === 'multiple_choice' ? (options[1] || null) : null,
        optionC: selectedQuestionType === 'multiple_choice' ? (options[2] || null) : null,
        optionD: selectedQuestionType === 'multiple_choice' ? (options[3] || null) : null,
        correctAnswer: selectedQuestionType === 'multiple_choice' ? correctAnswer.toUpperCase() : correctAnswer,
        topic: selectedSkill,
        difficulty: 'hard',
        imageUrl: imageUrl,
        accessLevel: selectedAccessLevel // Pass the selected access level
      };
      
      console.log('Question data being sent:', questionData);
      
      const questionWithImages = {
        ...questionData,
        optionAImage: optionImageUrls[0],
        optionBImage: optionImageUrls[1],
        optionCImage: optionImageUrls[2],
        optionDImage: optionImageUrls[3]
      };
      
      await uploadSingleQuestion(questionWithImages);
      
      // Verify the question was saved correctly
      console.log('Question uploaded, verifying...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (verifyData && verifyData.length > 0) {
        console.log('Last uploaded question in database:', verifyData[0]);
      }
      
      const newCount = await getQuestionsCount();
      setQuestionsCount(newCount);
      
      // Reset form
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
      setQuestionNumber(null);
      setSelectedImage(null);
      setImagePreview(null);
      setImageUrl(null);
      setOptionTypes(['text', 'text', 'text', 'text']);
      setOptionImages([null, null, null, null]);
      setOptionImagePreviews([null, null, null, null]);
      setOptionImageUrls([null, null, null, null]);
      setOptionImageUploading([false, false, false, false]);
      setSelectedAccessLevel('premium'); // Reset access level
      setUploadStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add question to database');
      setUploadStatus('error');
    }
  };

  // Reset form when question type changes
  React.useEffect(() => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setQuestionNumber(null);
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    setOptionTypes(['text', 'text', 'text', 'text']);
    setOptionImages([null, null, null, null]);
    setOptionImagePreviews([null, null, null, null]);
    setOptionImageUrls([null, null, null, null]);
    setOptionImageUploading([false, false, false, false]);
    setSelectedAccessLevel('premium'); // Reset access level
    setUploadStatus('idle');
    setErrorMessage('');
  }, [selectedQuestionType]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    setImageUploading(true);
    setErrorMessage('');
    
    try {
      const result = await ImageStorageService.uploadImage(selectedImage);
      setImageUrl(result.url);
      setUploadStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload image');
      setUploadStatus('error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const handleOptionTypeChange = (index: number, type: 'text' | 'image') => {
    const newTypes = [...optionTypes];
    newTypes[index] = type;
    setOptionTypes(newTypes);
    
    // Clear the option data when switching types
    if (type === 'text') {
      const newImages = [...optionImages];
      const newPreviews = [...optionImagePreviews];
      const newUrls = [...optionImageUrls];
      newImages[index] = null;
      newPreviews[index] = null;
      newUrls[index] = null;
      setOptionImages(newImages);
      setOptionImagePreviews(newPreviews);
      setOptionImageUrls(newUrls);
    } else {
      const newOptions = [...options];
      newOptions[index] = '';
      setOptions(newOptions);
    }
  };

  const handleOptionImageSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newImages = [...optionImages];
      const newPreviews = [...optionImagePreviews];
      newImages[index] = file;
      setOptionImages(newImages);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = e.target?.result as string;
        setOptionImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionImageUpload = async (index: number) => {
    const file = optionImages[index];
    if (!file) return;
    
    const newUploading = [...optionImageUploading];
    newUploading[index] = true;
    setOptionImageUploading(newUploading);
    setErrorMessage('');
    
    try {
      const result = await ImageStorageService.uploadImage(file);
      const newUrls = [...optionImageUrls];
      newUrls[index] = result.url;
      setOptionImageUrls(newUrls);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload option image');
      setUploadStatus('error');
    } finally {
      newUploading[index] = false;
      setOptionImageUploading(newUploading);
    }
  };

  const handleOptionImageRemove = (index: number) => {
    const newImages = [...optionImages];
    const newPreviews = [...optionImagePreviews];
    const newUrls = [...optionImageUrls];
    newImages[index] = null;
    newPreviews[index] = null;
    newUrls[index] = null;
    setOptionImages(newImages);
    setOptionImagePreviews(newPreviews);
    setOptionImageUrls(newUrls);
  };

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const questions = await getAllQuestions();
      setQuestionsList(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      setErrorMessage('Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string, questionText: string) => {
    if (!confirm(`Are you sure you want to delete this question?\n\n"${questionText.substring(0, 100)}..."`)) {
      return;
    }

    setDeletingQuestionId(questionId);
    try {
      await deleteQuestion(questionId);
      // Reload questions list
      await loadQuestions();
      // Update count
      const newCount = await getQuestionsCount();
      setQuestionsCount(newCount);
    } catch (error) {
      console.error('Error deleting question:', error);
      setErrorMessage('Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  React.useEffect(() => {
    loadQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upload Practice Questions
          </h1>
          <p className="text-lg text-gray-600">
            Bulk upload SAT Math questions to expand your practice database
          </p>
        </div>

        {/* Current Database Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Database</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Admin Access:</strong> Logged in as {user.email} | Target: 300 Hard Questions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">{questionsCount}</div>
              <div className="text-sm text-teal-600">Total Questions</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">8</div>
              <div className="text-sm text-blue-600">Topics Covered</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">3</div>
              <div className="text-sm text-green-600">Difficulty Levels</div>
            </div>
          </div>
        </div>

        {/* Upload Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Instructions</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All questions are automatically set to <strong>HARD</strong> difficulty</li>
                <li>• Select the skill category before uploading</li>
                <li>• Choose question type: Multiple Choice or Open-Ended</li>
                <li>• Questions will be categorized under the selected skill</li>
                <li>• Target: 75 questions per skill (300 total)</li>
                <li>• Explanations are optional and not required</li>
              </ul>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-teal-100 p-2 rounded-full">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Supported Formats</h3>
                <p className="text-sm text-gray-600">Upload CSV or JSON files with your questions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Required Fields</h3>
                <p className="text-sm text-gray-600">
                  <strong>Multiple Choice:</strong> questionNumber, question, optionA-D, correctAnswer (A/B/C/D)<br/>
                  <strong>Open-Ended:</strong> questionNumber, question, correctAnswer (number)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Download className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Template Available</h3>
                <p className="text-sm text-gray-600">Download our CSV template with mathematical notation support</p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  Download Template →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Single Question Upload Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Question</h2>
          
          {/* Question Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Question Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedQuestionType('multiple_choice')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedQuestionType === 'multiple_choice'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-semibold">Multiple Choice</div>
                <div className="text-sm text-gray-500 mt-1">A, B, C, D options</div>
              </button>
              <button
                onClick={() => setSelectedQuestionType('open_ended')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedQuestionType === 'open_ended'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-semibold">Open-Ended</div>
                <div className="text-sm text-gray-500 mt-1">Numeric answer</div>
              </button>
            </div>
          </div>

          {/* Access Level Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Access Level</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedAccessLevel('free')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAccessLevel === 'free'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-semibold">Free (30 questions)</div>
                <div className="text-sm text-gray-500 mt-1">Accessible to all users</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAccessLevel('premium')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAccessLevel === 'premium'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-semibold">Premium (270 questions)</div>
                <div className="text-sm text-gray-500 mt-1">Requires paid subscription</div>
              </button>
            </div>
          </div>

          {/* Question Input */}
          {selectedQuestionType && (
            <>
              <div className="mb-6">
                <MathInput
                  label="Question Text"
                  value={questionText}
                  onChange={setQuestionText}
                  placeholder="Enter your question with LaTeX notation (e.g., \\frac{a}{6}x^{2} + \\frac{b}{6}x + \\frac{c}{6})"
                />
              </div>

              {/* Multiple Choice Options */}
              {selectedQuestionType === 'multiple_choice' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Answer Options</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose between text (with LaTeX support) or image for each option
                  </p>
                  <div className="space-y-4">
                    {['A', 'B', 'C', 'D'].map((letter, index) => (
                      <div key={letter} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-700">Option {letter}</span>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOptionTypeChange(index, 'text')}
                              className={`px-3 py-1 text-xs rounded ${
                                optionTypes[index] === 'text'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Text
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOptionTypeChange(index, 'image')}
                              className={`px-3 py-1 text-xs rounded ${
                                optionTypes[index] === 'image'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Image
                            </button>
                          </div>
                        </div>
                        
                        {optionTypes[index] === 'text' ? (
                          <div>
                            <input
                              type="text"
                              value={options[index]}
                              onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                              placeholder={`Option ${letter} (supports LaTeX: \\frac{1}{2}, x^{2})`}
                            />
                            {options[index] && (
                              <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                <MathRenderer inline>{options[index]}</MathRenderer>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {!optionImagePreviews[index] && !optionImageUrls[index] && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                <div className="text-center">
                                  <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                  <div className="flex text-sm text-gray-600 justify-center">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500">
                                      <span>Upload image for option {letter}</span>
                                      <input
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        onChange={(e) => handleOptionImageSelect(index, e)}
                                      />
                                    </label>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                                </div>
                              </div>
                            )}

                            {optionImagePreviews[index] && !optionImageUrls[index] && (
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={optionImagePreviews[index]!}
                                    alt={`Option ${letter} preview`}
                                    className="max-w-full h-auto max-h-32 rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleOptionImageRemove(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{optionImages[index]?.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {optionImages[index] && ImageStorageService.formatFileSize(optionImages[index]!.size)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOptionImageUpload(index)}
                                    disabled={optionImageUploading[index]}
                                    className="bg-teal-600 text-white px-3 py-1 text-sm rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {optionImageUploading[index] ? 'Uploading...' : 'Upload'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {optionImageUrls[index] && (
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={optionImageUrls[index]!}
                                    alt={`Option ${letter}`}
                                    className="max-w-full h-auto max-h-32 rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleOptionImageRemove(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                  <p className="text-sm text-green-800">
                                    ✓ Image uploaded for option {letter}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open-Ended Answer Input */}
              {selectedQuestionType === 'open_ended' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answer</label>
                  <div className="max-w-xs">
                    <input
                      type="text"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter numeric answer (e.g., 42, 3.14, -5)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For open-ended questions, enter the exact numeric value
                    </p>
                  </div>
                </div>
              )}

              {/* Multiple Choice Correct Answer Selection */}
              {selectedQuestionType === 'multiple_choice' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answer</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select which option (A, B, C, or D) is the correct answer
                  </p>
                  <div className="flex space-x-3">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <button
                        key={letter}
                        onClick={() => setCorrectAnswer(letter)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          correctAnswer === letter
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Preview */}
              {questionText && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Question Preview:</h3>
                  <div className="bg-white p-3 rounded border">
                    <MathRenderer>{questionText}</MathRenderer>
                    
                    {selectedQuestionType === 'multiple_choice' && (
                      <div className="mt-4 space-y-3">
                        {['A', 'B', 'C', 'D'].map((letter, index) => {
                          const hasContent = optionTypes[index] === 'text' 
                            ? options[index].trim() 
                            : optionImageUrls[index];
                          
                          return hasContent ? (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="font-medium text-gray-700 mt-1">
                                {letter}.
                              </span>
                              <div className="flex-1">
                                {optionTypes[index] === 'text' ? (
                                  <MathRenderer inline>{options[index]}</MathRenderer>
                                ) : (
                                  <img
                                    src={optionImageUrls[index]!}
                                    alt={`Option ${letter}`}
                                    className="max-w-full h-auto max-h-24 rounded border"
                                  />
                                )}
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Image (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload graphs, diagrams, or other visual elements for your question
                </p>
                
                {!imagePreview && !imageUrl && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                          <span>Upload an image</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF, SVG up to 5MB
                      </p>
                    </div>
                  </div>
                )}

                {imagePreview && !imageUrl && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={handleImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedImage?.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedImage && ImageStorageService.formatFileSize(selectedImage.size)}
                        </p>
                      </div>
                      <button
                        onClick={handleImageUpload}
                        disabled={imageUploading}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {imageUploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                    </div>
                  </div>
                )}

                {imageUrl && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Uploaded question image"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={handleImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✓ Image uploaded successfully and will be included with the question
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Number (Optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Number (Optional)
                </label>
                <input
                  type="number"
                  value={questionNumber || ''}
                  onChange={(e) => setQuestionNumber(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="1-300"
                  min="1"
                  max="300"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank for auto-numbering</p>
              </div>

              {/* Add Question Button */}
              <button
                onClick={handleAddQuestion}
                disabled={!canAddQuestion()}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  canAddQuestion()
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Question to {selectedSkill}
              </button>

              {!canAddQuestion() && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please fill in all required fields: skill, question type, question text, 
                  {selectedQuestionType === 'multiple_choice' ? ' all options,' : ''} and correct answer
                </p>
              )}
            </>
          )}
        </div>

        {/* Skill Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Skill Category</h2>
          <p className="text-gray-600 mb-4">
            Choose which skill category these questions belong to. All questions in your upload will be assigned to this skill.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedSkill === skill
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-semibold">{skill}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {skill === 'Algebra' && 'Linear equations, quadratics, systems, inequalities'}
                  {skill === 'Advanced Math' && 'Functions, polynomials, radicals, exponentials'}
                  {skill === 'Problem Solving and Data Analysis' && 'Statistics, probability, data interpretation'}
                  {skill === 'Geo/Trig' && 'Geometry, trigonometry, coordinate geometry'}
                </div>
              </button>
            ))}
          </div>
          {selectedSkill && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Selected: <strong>{selectedSkill}</strong> - All uploaded questions will be categorized under this skill
              </p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {uploadStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Question Added Successfully!</h3>
            </div>
            <p className="text-sm text-green-700">
              Your question has been added to the {selectedSkill} question bank.
            </p>
          </div>
        )}

        {/* Error Message */}
        {uploadStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <X className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Error Adding Question</h3>
            </div>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Manage Existing Questions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Existing Questions</h2>
          
          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading questions...</p>
            </div>
          ) : questionsList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No questions found in the database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questionsList.map((question, index) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.question_number || index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={question.question}>
                          {question.question.length > 80 
                            ? `${question.question.substring(0, 80)}...` 
                            : question.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {question.topic}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.question_type === 'multiple_choice' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Open-Ended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.question_type === 'multiple_choice' 
                          ? question.correct_answer 
                          : question.correct_answer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.image_url ? (
                          <span className="text-green-600 text-xs">✓ Has Image</span>
                        ) : (
                          <span className="text-gray-400 text-xs">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.access_level === 'free' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.access_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteQuestion(question.id, question.question)}
                          disabled={deletingQuestionId === question.id}
                          className={`text-red-600 hover:text-red-900 transition-colors ${
                            deletingQuestionId === question.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Delete question"
                        >
                          {deletingQuestionId === question.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionUpload;