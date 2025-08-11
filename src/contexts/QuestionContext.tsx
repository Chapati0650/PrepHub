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

interface PracticeSession {
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent?: number | null;
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

interface RecentSession {
  id: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  sessionDate: string;
  createdAt: string;
}

interface QuestionContextType {
  generateQuestions: (settings: any) => Promise<QuestionData[]>;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
  isAdmin: () => boolean;
  getUserProgress: () => Promise<UserProgress | null>;
  getTopicMastery: () => Promise<TopicMastery[]>;
  getRecentSessions: () => Promise<RecentSession[]>;
  getQuestionsCount: () => Promise<number>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

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

  const getRandomQuestionsBySkill = async (skill: string, count: number, allowedAccessLevels: ('free' | 'premium')[]): Promise<QuestionData[]> => {
    try {
      console.log('=== RETRIEVAL DEBUG ===');
      console.log('Fetching questions for skill:', skill, 'count:', count);
      
      // Use direct query with proper limits and access level filtering
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
          is_active,
          access_level
        `)
        .eq('topic', skill)
        .in('access_level', allowedAccessLevels)
        .eq('is_active', true)
        .limit(count);
        
      if (error) {
        console.error('Error fetching questions by skill:', error);
        throw error;
      }
      
      console.log('Direct query successful, data:', data);
      return mapDatabaseToQuestionData(data);
    } catch (error) {
      console.error('Error fetching random questions by skill:', error);
      throw new Error(`Unable to load questions for skill: ${skill}`);
    }
  };

  const getRandomMixedQuestions = async (count: number, allowedAccessLevels: ('free' | 'premium')[]): Promise<QuestionData[]> => {
    try {
      console.log('=== MIXED RETRIEVAL DEBUG ===');
      console.log('Fetching mixed questions, count:', count);
      
      // Use direct query with proper limits and access level filtering
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
          is_active,
          access_level
        `)
        .eq('is_active', true)
        .in('access_level', allowedAccessLevels)
        .limit(count);
        
      if (error) {
        console.error('Error fetching mixed questions:', error);
        throw error;
      }
      
      console.log('Direct query successful, data:', data);
      return mapDatabaseToQuestionData(data);
    } catch (error) {
      console.error('Error fetching random mixed questions:', error);
      throw new Error('Unable to load questions from database');
    }
  };

  const generateQuestions = async (settings: any): Promise<QuestionData[]> => {
    try {
      console.log('=== GENERATE QUESTIONS DEBUG ===');
      console.log('Settings:', settings);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Determine access levels based on user's premium status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      const allowedAccessLevels: ('free' | 'premium')[] = userData?.is_premium 
        ? ['free', 'premium'] 
        : ['free'];

      console.log('User premium status:', userData?.is_premium);
      console.log('Allowed access levels:', allowedAccessLevels);

      let questions: QuestionData[];
      
      if (settings.topic === 'Mixed') {
        questions = await getRandomMixedQuestions(settings.questionCount, allowedAccessLevels);
      } else {
        questions = await getRandomQuestionsBySkill(settings.topic, settings.questionCount, allowedAccessLevels);
      }

      if (!questions || questions.length === 0) {
        throw new Error(`No questions available for ${settings.topic}`);
      }

      console.log('Generated questions:', questions.length);
      return questions;
    } catch (error) {
      console.error('Error in generateQuestions:', error);
      throw new Error(`Unable to load questions for skill: ${settings.topic}`);
    }
  };

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          topic: session.topic,
          difficulty: session.difficulty,
          total_questions: session.totalQuestions,
          correct_answers: session.correctAnswers,
          time_spent_seconds: session.timeSpent || 0
        });

      if (error) {
        console.error('Error saving practice session:', error);
        throw error;
      }

      console.log('Practice session saved successfully');
    } catch (error) {
      console.error('Error in savePracticeSession:', error);
      throw error;
    }
  };

  const isAdmin = (): boolean => {
    return user?.email === 'rptestprepservices@gmail.com';
  };

  const getUserProgress = async (): Promise<UserProgress | null> => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user progress:', error);
        throw error;
      }

      return data ? {
        totalQuestionsAnswered: data.total_questions_answered || 0,
        totalCorrectAnswers: data.total_correct_answers || 0,
        totalTimeSpentSeconds: data.total_time_spent_seconds || 0,
        currentStreak: data.current_streak || 0,
        lastPracticeDate: data.last_practice_date
      } : null;
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  };

  const getTopicMastery = async (): Promise<TopicMastery[]> => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching topic mastery:', error);
        throw error;
      }

      return data?.map(tm => ({
        topic: tm.topic,
        masteryPercentage: tm.mastery_percentage
      })) || [];
    } catch (error) {
      console.error('Error in getTopicMastery:', error);
      return [];
    }
  };

  const getRecentSessions = async (): Promise<RecentSession[]> => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent sessions:', error);
        throw error;
      }

      return data?.map(session => ({
        id: session.id,
        topic: session.topic,
        difficulty: session.difficulty,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,
        timeSpentSeconds: session.time_spent_seconds,
        sessionDate: session.session_date,
        createdAt: session.created_at
      })) || [];
    } catch (error) {
      console.error('Error in getRecentSessions:', error);
      return [];
    }
  };

  const getQuestionsCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('access_level', ['free', 'premium']);

      if (error) {
        console.error('Error getting questions count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getQuestionsCount:', error);
      return 0;
    }
  };

  const value: QuestionContextType = {
    generateQuestions,
    savePracticeSession,
    isAdmin,
    getUserProgress,
    getTopicMastery,
    getRecentSessions,
    getQuestionsCount
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