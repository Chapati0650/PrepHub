import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

interface PracticeSession {
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
}

interface UserProgress {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  lastPracticeDate: string | null;
}

interface QuestionContextType {
  generateQuestions: (settings: PracticeSettings) => Promise<QuestionData[]>;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
  getUserProgress: () => Promise<UserProgress | null>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const generateQuestions = async (settings: PracticeSettings): Promise<QuestionData[]> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    let query = supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .eq('difficulty', settings.difficulty);

    // Handle topic filtering
    if (settings.topic !== 'Mixed') {
      query = query.eq('topic', settings.topic);
    }

    // Apply access level filtering based on user's premium status
    if (!user.is_premium) {
      query = query.eq('access_level', 'free');
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }

    if (!questions || questions.length === 0) {
      throw new Error('No questions available for the selected criteria');
    }

    // Shuffle and limit questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, settings.questionCount);

    return selectedQuestions.map(q => ({
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
  };

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

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

    if (error) {
      console.error('Error saving practice session:', error);
      throw new Error('Failed to save practice session');
    }
  };

  const getUserProgress = async (): Promise<UserProgress | null> => {
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user progress:', error);
      return null;
    }

    if (!data) {
      return {
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalTimeSpentSeconds: 0,
        currentStreak: 0,
        lastPracticeDate: null
      };
    }

    return {
      totalQuestionsAnswered: data.total_questions_answered || 0,
      totalCorrectAnswers: data.total_correct_answers || 0,
      totalTimeSpentSeconds: data.total_time_spent_seconds || 0,
      currentStreak: data.current_streak || 0,
      lastPracticeDate: data.last_practice_date
    };
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