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

interface QuestionContextType {
  generateQuestions: (settings: any) => Promise<QuestionData[]>;
  savePracticeSession: (sessionData: any) => Promise<void>;
  getUserProgress: () => Promise<any>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mapDatabaseToQuestionData = (dbQuestions: any[]): QuestionData[] => {
    return dbQuestions.map(q => ({
      id: q.id,
      question: q.question,
      questionType: q.question_type || 'multiple_choice',
      options: q.question_type === 'multiple_choice' 
        ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean)
        : [],
      correctAnswer: q.question_type === 'multiple_choice' 
        ? ['A', 'B', 'C', 'D'].indexOf(q.correct_answer)
        : 0,
      correctAnswerText: q.correct_answer,
      explanation: q.explanation || '',
      topic: q.topic,
      difficulty: q.difficulty,
      imageUrl: q.image_url
    }));
  };

  const generateQuestions = async (settings: any): Promise<QuestionData[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's premium status
    const { data: userData } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    const isPremium = userData?.is_premium || false;
    const allowedAccessLevels = isPremium ? ['free', 'premium'] : ['free'];

    if (settings.topic === 'Mixed') {
      // Mixed questions from all topics
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .in('access_level', allowedAccessLevels)
        .limit(Math.min(settings.questionCount, 50));
        
      if (error) {
        console.error('Error fetching mixed questions:', error);
        throw error;
      }
      
      return mapDatabaseToQuestionData(data || []);
    } else {
      // Questions from specific topic
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic', settings.topic)
        .eq('difficulty', settings.difficulty)
        .eq('is_active', true)
        .in('access_level', allowedAccessLevels)
        .limit(Math.min(settings.questionCount, 50));
        
      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      
      return mapDatabaseToQuestionData(data || []);
    }
  };

  const savePracticeSession = async (sessionData: any): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        topic: sessionData.topic,
        difficulty: sessionData.difficulty,
        total_questions: sessionData.totalQuestions,
        correct_answers: sessionData.correctAnswers,
        time_spent_seconds: sessionData.timeSpent
      });

    if (error) {
      console.error('Error saving practice session:', error);
      throw error;
    }
  };

  const getUserProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user progress:', error);
      throw error;
    }

    return data;
  };

  const value = {
    generateQuestions,
    savePracticeSession,
    getUserProgress
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