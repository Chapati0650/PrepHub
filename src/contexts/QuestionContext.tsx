import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface QuestionData {
  id: string;
  question: string;
  questionType: 'multiple_choice' | 'open_ended';
  options: string[];
  correctAnswer: number;
  correctAnswerText: string;
  explanation: string;
  topic: string;
  difficulty: string;
  imageUrl?: string;
}

interface PracticeSettings {
  topic: string;
  difficulty: string;
  questionCount: number;
  timedMode: boolean;
  customTimePerQuestion: number;
}

interface QuestionContextType {
  generateQuestions: (settings: PracticeSettings) => Promise<QuestionData[]>;
  savePracticeSession: (session: any) => Promise<void>;
  recordQuestionAttempt: (questionId: string, isCorrect: boolean) => Promise<void>;
  getUserProgress: () => Promise<any>;
  getRecentSessions: () => Promise<any[]>;
  getQuestionsCount: () => Promise<any>;
  isAdmin: () => Promise<boolean>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const generateQuestions = async (settings: PracticeSettings): Promise<QuestionData[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get correctly answered question IDs (only these are considered "completed")
      const { data: completedQuestions, error: completedError } = await supabase
        .from('user_question_attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_correct', true);

      if (completedError) {
        console.error('Error fetching completed questions:', completedError);
        throw completedError;
      }

      const completedQuestionIds = completedQuestions?.map(cq => cq.question_id) || [];

      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);

      if (settings.topic !== 'Mixed') {
        query = query.eq('topic', settings.topic);
      }

      query = query.eq('difficulty', settings.difficulty);

      // Only add not.in filter if there are completed questions
      if (completedQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${completedQuestionIds.join(',')})`);
      }

      // Order by question_number for sequential presentation
      const { data: questions, error } = await query
        .order('question_number', { ascending: true })
        .limit(settings.questionCount);

      if (error) {
        console.error('Database error for topic', settings.topic + ':', error.message);
        throw error;
      }

      if (!questions || questions.length === 0) {
        // If no new questions available, user has completed all questions for this topic/difficulty
        throw new Error('Congratulations! You have completed all available questions for this topic and difficulty level.');
      }

      // Take questions in sequential order (already ordered by question_number)
      const selected = questions.slice(0, settings.questionCount);

      return selected.map(q => ({
        id: q.id,
        question: q.question,
        questionType: q.question_type as 'multiple_choice' | 'open_ended',
        options: q.question_type === 'multiple_choice' 
          ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean)
          : [],
        correctAnswer: q.question_type === 'multiple_choice' 
          ? ['A', 'B', 'C', 'D'].indexOf(q.correct_answer)
          : -1,
        correctAnswerText: q.correct_answer,
        explanation: q.explanation || '',
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.image_url
      }));
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  };

  const savePracticeSession = async (session: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          topic: session.topic,
          difficulty: session.difficulty,
          total_questions: session.totalQuestions,
          correct_answers: session.correctAnswers,
          time_spent_seconds: session.timeSpentSeconds
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving practice session:', error);
      throw error;
    }
  };

  const recordQuestionAttempt = async (questionId: string, isCorrect: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('📝 Recording question attempt:', { questionId, isCorrect, userId: user.id });

      const { error } = await supabase
        .from('user_question_attempts')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          is_correct: isCorrect
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) {
        console.error('❌ Error recording question attempt:', error);
        throw error;
      }

      console.log('✅ Question attempt recorded successfully');
    } catch (error) {
      console.error('Error recording question attempt:', error);
      throw error;
    }
  };

  const getUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('📊 Fetching user progress for:', user.id);

      // First, get the count of correct question attempts directly
      const { data: correctAttempts, error: attemptsError } = await supabase
        .from('user_question_attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_correct', true);

      if (attemptsError) {
        console.error('❌ Error fetching correct attempts:', attemptsError);
      }

      const correctAttemptsCount = correctAttempts?.length || 0;
      console.log('📊 Direct count of correct attempts:', correctAttemptsCount);

      // Get progress from user_progress table
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching user progress:', error);
      }

      // If no progress record exists, return calculated values
      if (!data) {
        console.log('📊 No progress record found, using direct count');

        return {
          totalQuestionsAnswered: correctAttemptsCount,
          totalCorrectAnswers: correctAttemptsCount,
          totalTimeSpentSeconds: 0,
          currentStreak: 0,
          lastPracticeDate: null
        };
      }

      console.log('📊 User progress found:', data);
      
      // Use the direct count if it's higher than what's in the progress table
      // This handles cases where the trigger might not have fired
      const finalProgress = {
        ...data,
        totalQuestionsAnswered: Math.max(data.total_questions_answered || 0, correctAttemptsCount),
        totalCorrectAnswers: Math.max(data.total_correct_answers || 0, correctAttemptsCount)
      };
      
      console.log('📊 Final progress with direct count:', finalProgress);
      return finalProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  };

  const getRecentSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      throw error;
    }
  };

  const getQuestionsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting questions count:', error);
      return 0;
    }
  };

  const isAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdminUser = user?.email === 'rptestprepservices@gmail.com';
      console.log('🔐 Admin check:', { email: user?.email, isAdmin: isAdminUser });
      return isAdminUser;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const value = {
    generateQuestions,
    savePracticeSession,
    recordQuestionAttempt,
    getUserProgress,
    getRecentSessions,
    getQuestionsCount,
    isAdmin
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestions = (): QuestionContextType => {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};