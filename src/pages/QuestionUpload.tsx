import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Save, AlertCircle, CheckCircle, Image, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MathInput from '../components/MathInput';
import MathRenderer from '../components/MathRenderer';
import { ImageStorageService } from '../lib/imageStorage';

interface QuestionForm {
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  accessLevel: string;
  imageUrl: string;
  optionAImage: string;
  optionBImage: string;
  optionCImage: string;
  optionDImage: string;
}

const QuestionUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const [form, setForm] = useState<QuestionForm>({
    question: '',
    questionType: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    topic: 'Algebra',
    difficulty: 'hard',
    accessLevel: 'premium',
    imageUrl: '',
    optionAImage: '',
    optionBImage: '',
    optionCImage: '',
    optionDImage: ''
  });

  // Check if user is admin
  React.useEffect(() => {
    if (!user || user.email !== 'rptestprepservices@gmail.com') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (field: keyof QuestionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File, field: string) => {
    try {
      setUploadingImage(field);
      const result = await ImageStorageService.uploadImage(file);
      handleInputChange(field as keyof QuestionForm, result.url);
      setMessage(`Image uploaded successfully for ${field}`);
      setMessageType('success');
    } catch (error) {
      console.error('Image upload error:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to upload image');
      setMessageType('error');
    } finally {
      setUploadingImage(null);
    }
  };

  const removeImage = (field: string) => {
    handleInputChange(field as keyof QuestionForm, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    console.log('📝 Starting question upload...');
    console.log('📝 Form data:', form);

    try {
      // Validation
      if (!form.question.trim()) {
        console.error('❌ Question text is empty');
        throw new Error('Question text is required');
      }

      if (form.questionType === 'multiple_choice') {
        if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
          console.error('❌ Missing options for multiple choice');
          throw new Error('All four options are required for multiple choice questions');
        }
        if (!['A', 'B', 'C', 'D'].includes(form.correctAnswer)) {
          console.error('❌ Invalid correct answer for multiple choice');
          throw new Error('Correct answer must be A, B, C, or D for multiple choice questions');
        }
      } else {
        if (!form.correctAnswer.trim()) {
          console.error('❌ Missing correct answer for open ended');
          throw new Error('Correct answer is required for open-ended questions');
        }
      }

      console.log('✅ Validation passed');
      
      // Get the next question number
      console.log('🔢 Getting next question number...');
      const { data: maxQuestionData, error: maxError } = await supabase
        .from('questions')
        .select('question_number')
        .order('question_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) {
        console.error('❌ Error getting max question number:', maxError);
        throw maxError;
      }

      const nextQuestionNumber = (maxQuestionData?.question_number || 0) + 1;
      console.log('🔢 Next question number:', nextQuestionNumber);

      // Prepare question data
      const questionData = {
        question_number: nextQuestionNumber,
        question: form.question,
        question_type: form.questionType,
        option_a: form.questionType === 'multiple_choice' ? form.optionA : null,
        option_b: form.questionType === 'multiple_choice' ? form.optionB : null,
        option_c: form.questionType === 'multiple_choice' ? form.optionC : null,
        option_d: form.questionType === 'multiple_choice' ? form.optionD : null,
        correct_answer: form.correctAnswer,
        explanation: form.explanation || null,
        topic: form.topic,
        difficulty: form.difficulty,
        access_level: form.accessLevel,
        image_url: form.imageUrl || null,
        option_a_image: form.optionAImage || null,
        option_b_image: form.optionBImage || null,
        option_c_image: form.optionCImage || null,
        option_d_image: form.optionDImage || null,
        created_by: user?.id,
        is_active: true
      };

      console.log('💾 Inserting question data:', questionData);
      const { error } = await supabase
        .from('questions')
        .insert(questionData);

      if (error) {
        console.error('❌ Database insert error:', error);
        throw error;
      }

      console.log('✅ Question uploaded successfully!');
      setMessage(`Question #${nextQuestionNumber} uploaded successfully!`);
      setMessageType('success');
      
      // Reset form
      setForm({
        question: '',
        questionType: 'multiple_choice',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: '',
        topic: 'Algebra',
        difficulty: 'hard',
        accessLevel: 'premium',
        imageUrl: '',
        optionAImage: '',
        optionBImage: '',
        optionCImage: '',
        optionDImage: ''
      });

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload question';
      console.error('❌ Final error message:', errorMessage);
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadField = ({ 
    label, 
    field, 
    currentUrl 
  }: { 
    label: string; 
    field: string; 
    currentUrl: string; 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, field);
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploadingImage === field}
        />
        {uploadingImage === field && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )}
        {currentUrl && (
          <button
            type="button"
            onClick={() => removeImage(field)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {currentUrl && (
        <div className="mt-2">
          <img
            src={currentUrl}
            alt="Preview"
            className="max-w-32 h-auto rounded border border-gray-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );

  if (!user || user.email !== 'rptestprepservices@gmail.com') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to upload questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload SAT Math Question</h1>
          <p className="text-gray-600">Add new questions to the practice database</p>
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
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <select
              value={form.questionType}
              onChange={(e) => handleInputChange('questionType', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="open_ended">Open Ended (Numeric Answer)</option>
            </select>
          </div>

          {/* Question Text */}
          <MathInput
            label="Question Text"
            value={form.question}
            onChange={(value) => handleInputChange('question', value)}
            placeholder="Enter the question text (use math notation like x^2, sqrt(x), etc.)"
            showPreview={true}
          />

          {/* Question Image */}
          <ImageUploadField
            label="Question Image (Optional)"
            field="imageUrl"
            currentUrl={form.imageUrl}
          />

          {/* Multiple Choice Options */}
          {form.questionType === 'multiple_choice' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Answer Options</h3>
              
              {['A', 'B', 'C', 'D'].map((letter, index) => (
                <div key={letter} className="space-y-3">
                  <MathInput
                    label={`Option ${letter}`}
                    value={form[`option${letter}` as keyof QuestionForm] as string}
                    onChange={(value) => handleInputChange(`option${letter}` as keyof QuestionForm, value)}
                    placeholder={`Enter option ${letter} (use math notation like x^2, sqrt(x), etc.)`}
                    showPreview={true}
                  />
                  
                  <ImageUploadField
                    label={`Option ${letter} Image (Optional)`}
                    field={`option${letter}Image`}
                    currentUrl={form[`option${letter}Image` as keyof QuestionForm] as string}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
            {form.questionType === 'multiple_choice' ? (
              <select
                value={form.correctAnswer}
                onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            ) : (
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the numeric answer (e.g., 42, 3.14, -5)"
              />
            )}
          </div>

          {/* Explanation */}
          <MathInput
            label="Explanation (Optional)"
            value={form.explanation}
            onChange={(value) => handleInputChange('explanation', value)}
            placeholder="Explain how to solve this question (use math notation like x^2, sqrt(x), etc.)"
            showPreview={true}
          />

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <select
              value={form.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Algebra">Algebra</option>
              <option value="Advanced Math">Advanced Math</option>
              <option value="Problem Solving and Data Analysis">Problem Solving and Data Analysis</option>
              <option value="Geo/Trig">Geo/Trig</option>
            </select>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
            <select
              value={form.accessLevel}
              onChange={(e) => handleInputChange('accessLevel', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Preview Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-lg font-medium text-gray-900 mb-4">
                <MathRenderer>{form.question}</MathRenderer>
              </div>
              
              {form.imageUrl && (
                <div className="mb-4">
                  <img
                    src={form.imageUrl}
                    alt="Question"
                    className="max-w-full h-auto max-h-64 rounded border border-gray-300 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {form.questionType === 'multiple_choice' && (
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, index) => {
                    const optionText = form[`option${letter}` as keyof QuestionForm] as string;
                    const optionImage = form[`option${letter}Image` as keyof QuestionForm] as string;
                    
                    if (!optionText && !optionImage) return null;
                    
                    return (
                      <div
                        key={letter}
                        className={`p-3 rounded border ${
                          form.correctAnswer === letter 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <span className="font-medium">{letter}.</span>
                          <div className="flex-1">
                            {optionImage ? (
                              <img
                                src={optionImage}
                                alt={`Option ${letter}`}
                                className="max-w-full h-auto max-h-32 rounded border border-gray-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <MathRenderer>{optionText}</MathRenderer>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {form.explanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <MathRenderer>{form.explanation}</MathRenderer>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Uploading...' : 'Upload Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionUpload;