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

interface PracticeSession {
  id: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  sessionDate: string;
}

interface UserProgress {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  lastPracticeDate: string | null;
}

interface TopicMastery {
  topic: string;
  masteryPercentage: number;
}

interface QuestionContextType {
  generateQuestions: (settings: any) => Promise<QuestionData[]>;
  savePracticeSession: (sessionData: any) => Promise<void>;
  getUserProgress: () => Promise<UserProgress | null>;
  getTopicMastery: () => Promise<TopicMastery[]>;
  getRecentSessions: () => Promise<PracticeSession[]>;
  isAdmin: () => Promise<boolean>;
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

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic', settings.topic)
      .in('access_level', allowedAccessLevels)
      .eq('is_active', true)
      .limit(Math.min(settings.questionCount, 50));
      
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    // Shuffle and return requested number of questions
    const shuffled = data.sort(() => Math.random() - 0.5);
    return mapDatabaseToQuestionData(shuffled.slice(0, settings.questionCount));
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
        time_spent_seconds: sessionData.timeSpentSeconds
      });

    if (error) {
      console.error('Error saving practice session:', error);
      throw error;
    }
  };

  const getUserProgress = async (): Promise<UserProgress | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user progress:', error);
      return null;
    }

    return data ? {
      totalQuestionsAnswered: data.total_questions_answered || 0,
      totalCorrectAnswers: data.total_correct_answers || 0,
      totalTimeSpentSeconds: data.total_time_spent_seconds || 0,
      currentStreak: data.current_streak || 0,
      lastPracticeDate: data.last_practice_date
    } : null;
  };

  const getTopicMastery = async (): Promise<TopicMastery[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching topic mastery:', error);
      return [];
    }

    return data.map(tm => ({
      topic: tm.topic,
      masteryPercentage: tm.mastery_percentage
    }));
  };

  const getRecentSessions = async (): Promise<PracticeSession[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }

    return data.map(session => ({
      id: session.id,
      topic: session.topic,
      difficulty: session.difficulty,
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      timeSpentSeconds: session.time_spent_seconds,
      sessionDate: session.session_date
    }));
  };

  const isAdmin = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return user.email === 'rptestprepservices@gmail.com';
  };

  const value = {
    generateQuestions,
    savePracticeSession,
    getUserProgress,
    getTopicMastery,
    getRecentSessions,
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