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

      // Get solved question IDs first
      const { data: solvedQuestions, error: solvedError } = await supabase
        .from('user_question_attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_correct', true);

      if (solvedError) {
        console.error('Error fetching solved questions:', solvedError);
        throw solvedError;
      }

      const solvedQuestionIds = solvedQuestions?.map(sq => sq.question_id) || [];

      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);

      if (settings.topic !== 'Mixed') {
        query = query.eq('topic', settings.topic);
      }

      query = query.eq('difficulty', settings.difficulty);

      // Only add not.in filter if there are solved questions
      if (solvedQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${solvedQuestionIds.join(',')})`);
      }

      const { data: questions, error } = await query
        .order('question_number', { ascending: true })
        .limit(settings.questionCount);

      if (error) {
        console.error('Database error for topic', settings.topic + ':', error.message);
        throw error;
      }

      if (!questions || questions.length === 0) {
        throw new Error('No questions available for the selected criteria');
      }

      // Shuffle and limit to requested count
      const shuffled = questions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, settings.questionCount);

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

      const { error } = await supabase
        .from('user_question_attempts')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          is_correct: isCorrect
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording question attempt:', error);
      throw error;
    }
  };

  const getUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
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
      return user?.email === 'rptestprepservices@gmail.com';
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