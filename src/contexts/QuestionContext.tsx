import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PracticeSession { // Data structure for saving practice sessions
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
}

interface UserProgress { // Data structure for user's overall progress
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  lastPracticeDate: string | null;
}

interface TopicMastery { // Data structure for topic mastery
  topic: string;
  masteryPercentage: number;
}

interface RecentSession { // Data structure for recent practice sessions
  id: string;
  // Renamed from total_questions to total, and correct_answers to score for clarity in UI
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  date: string;
  timeSpent: number;
}

interface QuestionData { // Data structure for a single question retrieved from DB
  id: string;
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  options: string[];
  correctAnswer: number;
  correctAnswerText: string;
  explanation: string; // Optional explanation for the answer
  topic: string;
  difficulty: string;
  imageUrl?: string;
  accessLevel?: 'free' | 'premium'; // New: access level for the question
}

interface UploadQuestionData { // Data structure for uploading a new question
  questionNumber?: number | null;
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
  topic: string;
  difficulty: string;
  imageUrl?: string | null;
  accessLevel: 'free' | 'premium';
}

interface QuestionSettings {
  topic: string;
  difficulty: string;
  questionCount: number;
  timedMode: boolean;
}

interface QuestionContextType {
  generateQuestions: (settings: QuestionSettings) => Promise<QuestionData[]>; // Generates questions based on settings
  uploadSingleQuestion: (question: UploadQuestionData) => Promise<void>; // Uploads a single question to DB
  getQuestionsCount: () => Promise<number>;
  getRandomHardQuestions: (count: number) => Promise<QuestionData[]>;
  getAllQuestions: () => Promise<any[]>;
  deleteQuestion: (id: string) => Promise<void>;
  isAdmin: () => boolean;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
  getUserProgress: () => Promise<UserProgress | null>;
  getTopicMastery: () => Promise<TopicMastery[]>;
  getRecentSessions: (limit?: number) => Promise<RecentSession[]>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};

interface QuestionProviderProps {
  children: ReactNode;
}

export const QuestionProvider: React.FC<QuestionProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const generateQuestions = async (settings: QuestionSettings): Promise<QuestionData[]> => {
    const isPremiumUser = user?.isPremium;
    // Determine which access levels are allowed based on user's premium status
    const allowedAccessLevels: ('free' | 'premium')[] = isPremiumUser ? ['free', 'premium'] : ['free'];
    // Determine the maximum number of questions a user can request
    const maxQuestions = isPremiumUser ? 300 : 30;

    // Adjust the requested question count based on the user's access level
    const actualQuestionCount = Math.min(settings.questionCount, maxQuestions);

    try {
      if (settings.topic && settings.topic !== 'Mixed') {
        return await getRandomQuestionsBySkill(settings.topic, actualQuestionCount, allowedAccessLevels);
      } else {
        return await getRandomMixedQuestions(actualQuestionCount, allowedAccessLevels);
      }
    } catch (error) {
      console.error('Database error, falling back to generated questions:', error);
      throw new Error('Unable to load questions from database');
    }
  };

  const getRandomQuestionsBySkill = async (skill: string, count: number, allowedAccessLevels: ('free' | 'premium')[]): Promise<QuestionData[]> => {
    try {
      console.log('=== RETRIEVAL DEBUG ===');
      console.log('Fetching questions for skill:', skill, 'count:', count);
      
      // Try RPC function first
      let data, error;
      
      try {
        const rpcResult = await supabase.rpc('get_random_questions_by_skill', {
          skill_name: skill,
          question_count: Math.min(count, 10), // Limit RPC to 10 for performance/safety
          access_levels: allowedAccessLevels // Pass access levels to RPC
        });
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError) {
        console.log('RPC function not available, using direct query');
        error = rpcError;
      }

      if (error) {
        console.error('Error getting random questions by skill:', error);
        // Fallback to direct query if function doesn't exist
        console.log('RPC function failed, trying direct query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('questions')
          .select(`
            id,
            question_number,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation,
            topic,
            difficulty,
            question_type,
            image_url,
            created_at,
            created_by,
            is_active
          `)
          .eq('topic', skill) // Filter by topic
          .in('access_level', allowedAccessLevels) // Filter by access_level
          .eq('is_active', true)
          .limit(Math.min(count, 10));
          
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
        
        console.log('Direct query successful, data:', fallbackData);
        return mapDatabaseToQuestionData(fallbackData);
      }

      console.log('RPC function successful, data:', data);
      return mapDatabaseToQuestionData(data);
    } catch (error) {
      console.error('Error fetching random questions by skill:', error);
      throw new Error(`Unable to load questions for skill: ${skill}`);
    }
  };

  const mapDatabaseToQuestionData = (data: any[]): QuestionData[] => {
    if (!data || data.length === 0) {
      throw new Error('No questions available');
    }

    console.log('=== MAPPING DEBUG ===');
    console.log('Raw database data:', data);
    
    return data.map((q: any) => {
      console.log('Processing question:', {
        id: q.id,
        question_type: q.question_type,
        raw_options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d
        },
        image_url: q.image_url
      });
      
      // For multiple choice, use text options
      const options = q.question_type === 'multiple_choice' ? [
        q.option_a,
        q.option_b, 
        q.option_c,
        q.option_d
      ].filter(opt => opt !== null && opt !== undefined && opt.toString().trim() !== '') : [];
        
      const mapped = {
        id: q.id,
        question: q.question,
        questionType: q.question_type as 'multiple_choice' | 'open_ended',
        options: options,
        correctAnswer: q.question_type === 'multiple_choice' 
          ? ['A', 'B', 'C', 'D'].indexOf(q.correct_answer)
          : -1,
        correctAnswerText: q.correct_answer,
        explanation: q.explanation || '',
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.image_url || undefined
      };
      
      console.log('Mapped question result:', {
        id: mapped.id,
        questionType: mapped.questionType,
        optionsCount: mapped.options.length,
        options: mapped.options,
        hasImage: !!mapped.imageUrl,
        imageUrl: mapped.imageUrl
      });
      
      return mapped;
    });
  };

  const getRandomMixedQuestions = async (count: number, allowedAccessLevels: ('free' | 'premium')[]): Promise<QuestionData[]> => {
    try {
      console.log('=== MIXED RETRIEVAL DEBUG ===');
      console.log('Fetching mixed questions, count:', count);
      
      // Try RPC function first
      let data, error;
      
      try {
        const rpcResult = await supabase.rpc('get_random_questions_mixed', {
          question_count: Math.min(count, 10)
        }); // RPC function might need to be updated to accept access_levels
        // For now, assuming RPC fetches all and we filter later, or RPC is updated on Supabase side
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError) {
        console.log('RPC function not available, using direct query');
        error = rpcError;
      }

      if (error) {
        console.error('Error getting random mixed questions:', error);
        // Fallback to direct query if function doesn't exist
        console.log('RPC function failed, trying direct query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('questions')
          .select(`
            id,
            question_number,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation,
            topic,
            difficulty,
            question_type,
            image_url,
            created_at,
            created_by,
            is_active
          `)
          .eq('is_active', true) // Only active questions
          .in('access_level', allowedAccessLevels) // Filter by access_level
          .limit(Math.min(count, 10));
          
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
        
        console.log('Direct query successful, data:', fallbackData);
        return mapDatabaseToQuestionData(fallbackData);
      }


      console.log('RPC function successful, data:', data);
      return mapDatabaseToQuestionData(data);
    } catch (error) {
      console.error('Error fetching random mixed questions:', error);
      throw new Error('Unable to load questions from database');
    }
  };

  const uploadSingleQuestion = async (question: UploadQuestionData): Promise<void> => {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Only admin can upload questions');
    }

    console.log('=== UPLOAD DEBUG ===');
    console.log('Raw question data received:', question);
    console.log('Question type:', question.questionType);
    console.log('Options:', {
      A: question.optionA,
      B: question.optionB, 
      C: question.optionC,
      D: question.optionD
    });
    console.log('Image URL:', question.imageUrl);

    // Format question for database
    const formattedQuestion = {
      question_number: question.questionNumber || null,
      question: question.question,
      question_type: question.questionType,
      option_a: question.questionType === 'multiple_choice' ? question.optionA : null,
      option_b: question.questionType === 'multiple_choice' ? question.optionB : null,
      option_c: question.questionType === 'multiple_choice' ? question.optionC : null,
      option_d: question.questionType === 'multiple_choice' ? question.optionD : null,
      correct_answer: question.correctAnswer,
      explanation: null, // No explanations for now
      topic: question.topic,
      difficulty: 'hard', // All questions are hard
      created_by: user?.id,
      is_active: true,
      image_url: question.imageUrl || null, // Ensure image_url is passed
      access_level: question.accessLevel // New: Add access_level
    };

    console.log('Formatted for database:', formattedQuestion);

    // Insert into database
    const { error } = await supabase
      .from('questions')
      .insert([formattedQuestion]);

    if (error) {
      console.error('Error uploading question:', error);
      throw new Error('Failed to add question to database');
    }
    
    // Verify what was actually saved
    const { data: savedData, error: verifyError } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (savedData && savedData.length > 0) {
      console.log('=== VERIFICATION ===');
      console.log('What was actually saved to database:', savedData[0]);
      console.log('Saved question_type:', savedData[0].question_type);
      console.log('Saved options:', {
        A: savedData[0].option_a,
        B: savedData[0].option_b,
        C: savedData[0].option_c,
        D: savedData[0].option_d
      });
      console.log('Saved image_url:', savedData[0].image_url);
    }
    
    console.log('Question uploaded successfully');
  };

  const getQuestionsCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting questions count:', error);
      return 0;
    }

    return count || 0;
  };

  const getRandomHardQuestions = async (count: number): Promise<QuestionData[]> => {
    return await getRandomMixedQuestions(count);
  };

  const getAllQuestions = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_number,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          topic,
          difficulty,
          question_type,
          image_url,
          created_at,
          created_by,
          is_active
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all questions:', error);
        throw new Error('Failed to fetch questions');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllQuestions:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch questions');
    }
  };

  const deleteQuestion = async (id: string): Promise<void> => {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Only admin can delete questions');
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question:', error);
        throw new Error('Failed to delete question');
      }

      console.log('Question deleted successfully:', id);
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      throw error instanceof Error ? error : new Error('Failed to delete question');
    }
  };

  const isAdmin = (): boolean => {
    console.log('Checking admin status for:', user?.email);
    const isAdminUser = user?.email === 'rptestprepservices@gmail.com';
    console.log('Is admin:', isAdminUser);
    return isAdminUser;
  };

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be logged in to save practice session');
    }

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .insert([{
          user_id: user.id,
          topic: session.topic,
          difficulty: session.difficulty,
          total_questions: session.totalQuestions,
          correct_answers: session.correctAnswers,
          time_spent_seconds: session.timeSpentSeconds,
          session_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }]);

      if (error) {
        console.error('Error saving practice session:', error);
        throw new Error('Failed to save practice session');
      }

      console.log('Practice session saved successfully');
    } catch (error) {
      console.error('Error in savePracticeSession:', error);
      throw error instanceof Error ? error : new Error('Failed to save practice session');
    }
  };

  const getUserProgress = async (): Promise<UserProgress | null> => {
    if (!user?.id) {
      console.log('⚠️ No user ID for getUserProgress');
      return null;
    }

    try {
      console.log('📊 Fetching user progress for:', user.id);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user progress:', error);
        return {
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalTimeSpentSeconds: 0,
          currentStreak: 0,
          lastPracticeDate: null
        };
      }

      if (!data) {
        console.log('📊 No user progress data, returning defaults');
        return {
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalTimeSpentSeconds: 0,
          currentStreak: 0,
          lastPracticeDate: null
        };
      }

      console.log('📊 User progress found:', data);
      const result = {
        totalQuestionsAnswered: data.total_questions_answered || 0,
        totalCorrectAnswers: data.total_correct_answers || 0,
        totalTimeSpentSeconds: data.total_time_spent_seconds || 0,
        currentStreak: data.current_streak || 0,
        lastPracticeDate: data.last_practice_date
      };
      console.log('📊 Returning user progress:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in getUserProgress:', error);
      return null;
    }
  };

  const getTopicMastery = async (): Promise<TopicMastery[]> => {
    if (!user?.id) {
      console.log('⚠️ No user ID for getTopicMastery');
      return [];
    }

    try {
      console.log('📈 Fetching topic mastery for:', user.id);
      const { data, error } = await supabase
        .from('topic_mastery')
        .select('topic, mastery_percentage')
        .eq('user_id', user.id)
        .order('topic');

      if (error) {
        console.error('❌ Error fetching topic mastery:', error);
        return [];
      }

      console.log('📈 Topic mastery data:', data);
      return (data || []).map(item => ({
        topic: item.topic,
        masteryPercentage: item.mastery_percentage
      }));
    } catch (error) {
      console.error('❌ Error in getTopicMastery:', error);
      return [];
    }
  };

  const getRecentSessions = async (limit: number = 5): Promise<RecentSession[]> => {
    if (!user?.id) {
      console.log('⚠️ No user ID for getRecentSessions');
      return [];
    }

    try {
      console.log('📅 Fetching recent sessions for:', user.id);
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, topic, difficulty, total_questions, correct_answers, time_spent_seconds, session_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent sessions:', error);
        return [];
      }

      console.log('📅 Recent sessions data:', data);
      return (data || []).map(session => ({
        id: session.id,
        topic: session.topic,
        difficulty: session.difficulty,
        score: session.correct_answers,
        total: session.total_questions,
        date: session.session_date,
        timeSpent: session.time_spent_seconds
      }));
    } catch (error) {
      console.error('❌ Error in getRecentSessions:', error);
      return [];
    }
  };

  const value = {
    generateQuestions,
    uploadSingleQuestion,
    getQuestionsCount,
    getRandomHardQuestions,
    getAllQuestions,
    deleteQuestion,
    isAdmin,
    savePracticeSession,
    getUserProgress,
    getTopicMastery,
    getRecentSessions
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};