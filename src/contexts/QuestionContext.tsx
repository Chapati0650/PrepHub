import React, { createContext, useContext, useState } from 'react';
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
  timeSpentSeconds: number;
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
  totalQuestions: number;
  correctAnswers: number;
  sessionDate: string;
  timeSpentSeconds: number;
}

interface QuestionContextType {
  generateQuestions: (settings: any) => Promise<QuestionData[]>;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
  getUserProgress: () => Promise<UserProgress | null>;
  getTopicMastery: () => Promise<TopicMastery[]>;
  getRecentSessions: (limit?: number) => Promise<RecentSession[]>;
  getQuestionsCount: () => Promise<number>;
  isAdmin: () => boolean;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};

export const QuestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const generateQuestions = async (settings: any): Promise<QuestionData[]> => {
    try {
      console.log('=== GENERATION DEBUG ===');
      console.log('Settings received:', settings);
      console.log('User premium status:', user?.is_premium);

      // Determine access levels based on user's premium status
      const allowedAccessLevels: ('free' | 'premium')[] = user?.is_premium 
        ? ['free', 'premium'] 
        : ['free'];

      console.log('Allowed access levels:', allowedAccessLevels);

      let questions: QuestionData[] = [];

      if (settings.topic === 'Mixed' || !settings.topic) {
        console.log('Fetching mixed questions...');
        questions = await getRandomMixedQuestions(settings.questionCount, allowedAccessLevels);
      } else {
        console.log('Fetching questions for specific topic:', settings.topic);
        questions = await getRandomQuestionsBySkill(settings.topic, settings.questionCount, allowedAccessLevels);
      }

      if (questions.length === 0) {
        console.error('Database error, falling back to generated questions:', `Unable to load questions for skill: ${settings.topic}`);
        throw new Error('Unable to load questions from database');
      }

      console.log('Questions generated successfully:', questions.length);
      return questions;
    } catch (error) {
      console.error('Error in generateQuestions:', error);
      throw error;
    }
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

  const mapDatabaseToQuestionData = (dbQuestions: any[]): QuestionData[] => {
    return dbQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      questionType: q.question_type || 'multiple_choice',
      options: q.question_type === 'open_ended' ? [] : [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
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

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to save practice session');
    }

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          topic: session.topic,
          difficulty: session.difficulty,
          total_questions: session.totalQuestions,
          correct_answers: session.correctAnswers,
          time_spent_seconds: session.timeSpentSeconds,
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

  const getUserProgress = async (): Promise<UserProgress | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user progress:', error);
        throw error;
      }

      if (!data) {
        return {
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalTimeSpentSeconds: 0,
          currentStreak: 0,
          lastPracticeDate: null,
        };
      }

      return {
        totalQuestionsAnswered: data.total_questions_answered || 0,
        totalCorrectAnswers: data.total_correct_answers || 0,
        totalTimeSpentSeconds: data.total_time_spent_seconds || 0,
        currentStreak: data.current_streak || 0,
        lastPracticeDate: data.last_practice_date,
      };
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  };

  const getTopicMastery = async (): Promise<TopicMastery[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('topic_mastery')
        .select('topic, mastery_percentage')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching topic mastery:', error);
        return [];
      }

      return data.map(item => ({
        topic: item.topic,
        masteryPercentage: item.mastery_percentage,
      }));
    } catch (error) {
      console.error('Error in getTopicMastery:', error);
      return [];
    }
  };

  const getRecentSessions = async (limit: number = 5): Promise<RecentSession[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, topic, total_questions, correct_answers, session_date, time_spent_seconds')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent sessions:', error);
        return [];
      }

      return data.map(session => ({
        id: session.id,
        topic: session.topic,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,
        sessionDate: session.session_date,
        timeSpentSeconds: session.time_spent_seconds,
      }));
    } catch (error) {
      console.error('Error in getRecentSessions:', error);
      return [];
    }
  };

  const getQuestionsCount = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('access_level', ['free', 'premium']);

      if (error) {
        console.error('Error getting questions count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getQuestionsCount:', error);
      return 0;
    }
  };

  const getAllQuestions = async () => {
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
          is_active,
          access_level
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all questions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllQuestions:', error);
      throw error;
    }
  };

  const isAdmin = (): boolean => {
    return user?.email === 'rptestprepservices@gmail.com';
  };

  const value = {
    generateQuestions,
    savePracticeSession,
    getUserProgress,
    getTopicMastery,
    getRecentSessions,
    getQuestionsCount,
    isAdmin,
  };

  return <QuestionContext.Provider value={value}>{children}</QuestionContext.Provider>;
};