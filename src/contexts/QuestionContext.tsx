import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
  explanation: string | null;
  topic: string;
  difficulty: string;
  questionType: 'multiple_choice' | 'open_ended';
  imageUrl: string | null;
  isCompleted?: boolean;
}

interface QuestionContextType {
  getQuestionsList: (topic?: string, difficulty?: string) => Promise<Question[]>;
  getQuestionById: (id: string) => Promise<Question | null>;
  recordQuestionAttempt: (questionId: string, isCorrect: boolean) => Promise<void>;
  getUserProgress: () => Promise<any>;
  getRecentSessions: () => Promise<any[]>;
  getQuestionsCount: () => Promise<number>;
  savePracticeSession: (session: any) => Promise<void>;
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

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const getQuestionsList = async (topic?: string, difficulty: string = 'hard'): Promise<Question[]> => {
    try {
      console.log('📚 Fetching questions list for topic:', topic, 'difficulty:', difficulty);

      // Build the base query
      let query = supabase
        .from('questions')
        .select('id, question_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, topic, difficulty, question_type, image_url')
        .eq('difficulty', difficulty)
        .eq('is_active', true);

      // Add topic filter if specified
      if (topic && topic !== 'Mixed Skills' && topic !== '') {
        query = query.eq('topic', topic);
      }

      // Order by question number
      query = query.order('question_number', { ascending: true });

      const { data: questions, error } = await query;

      if (error) {
        console.error('❌ Error fetching questions:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!questions || questions.length === 0) {
        console.log('📭 No questions found for the specified criteria');
        return [];
      }

      console.log(`✅ Found ${questions.length} questions`);

      // Get user's completed questions if logged in
      let completedQuestionIds: string[] = [];
      if (user) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('user_question_attempts')
          .select('question_id')
          .eq('user_id', user.id)
          .eq('is_correct', true);

        if (attemptsError) {
          console.error('❌ Error fetching user attempts:', attemptsError);
        } else {
          completedQuestionIds = attempts?.map(attempt => attempt.question_id) || [];
          console.log(`✅ Found ${completedQuestionIds.length} completed questions for user`);
        }
      }

      // Transform and mark completed questions
      const transformedQuestions: Question[] = questions.map(q => ({
        id: q.id,
        questionNumber: q.question_number,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.question_type as 'multiple_choice' | 'open_ended',
        imageUrl: q.image_url,
        isCompleted: completedQuestionIds.includes(q.id)
      }));

      return transformedQuestions;
    } catch (error) {
      console.error('❌ Error in getQuestionsList:', error);
      throw error;
    }
  };

  const getQuestionById = async (id: string): Promise<Question | null> => {
    try {
      console.log('🔍 Fetching question by ID:', id);

      const { data: question, error } = await supabase
        .from('questions')
        .select('id, question_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, topic, difficulty, question_type, image_url')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Error fetching question:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!question) {
        console.log('📭 Question not found');
        return null;
      }

      // Check if user has completed this question
      let isCompleted = false;
      if (user) {
        const { data: attempt, error: attemptError } = await supabase
          .from('user_question_attempts')
          .select('is_correct')
          .eq('user_id', user.id)
          .eq('question_id', id)
          .single();

        if (!attemptError && attempt) {
          isCompleted = attempt.is_correct;
        }
      }

      const transformedQuestion: Question = {
        id: question.id,
        questionNumber: question.question_number,
        question: question.question,
        optionA: question.option_a,
        optionB: question.option_b,
        optionC: question.option_c,
        optionD: question.option_d,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
        questionType: question.question_type as 'multiple_choice' | 'open_ended',
        imageUrl: question.image_url,
        isCompleted
      };

      console.log('✅ Question fetched successfully');
      return transformedQuestion;
    } catch (error) {
      console.error('❌ Error in getQuestionById:', error);
      throw error;
    }
  };

  const recordQuestionAttempt = async (questionId: string, isCorrect: boolean): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to record attempts');
    }

    try {
      console.log(`📝 Recording attempt for question ${questionId}, correct: ${isCorrect}`);

      const { error } = await supabase
        .from('user_question_attempts')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          is_correct: isCorrect,
          attempted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) {
        console.error('❌ Error recording question attempt:', error);
        throw new Error(`Failed to record attempt: ${error.message}`);
      }

      console.log('✅ Question attempt recorded successfully');
    } catch (error) {
      console.error('❌ Error in recordQuestionAttempt:', error);
      throw error;
    }
  };

  const getUserProgress = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user progress:', error);
        return null;
      }

      return data || {
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalTimeSpentSeconds: 0,
        currentStreak: 0,
        lastPracticeDate: null
      };
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  };

  const getRecentSessions = async () => {
    if (!user) return [];

    try {
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

      return data || [];
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
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching questions count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getQuestionsCount:', error);
      return 0;
    }
  };

  const savePracticeSession = async (session: any): Promise<void> => {
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
          time_spent_seconds: session.timeSpentSeconds
        });

      if (error) {
        console.error('Error saving practice session:', error);
        throw new Error(`Failed to save session: ${error.message}`);
      }

      console.log('✅ Practice session saved successfully');
    } catch (error) {
      console.error('Error in savePracticeSession:', error);
      throw error;
    }
  };

  const isAdmin = (): boolean => {
    return user?.email === 'rptestprepservices@gmail.com';
  };

  const value = {
    getQuestionsList,
    getQuestionById,
    recordQuestionAttempt,
    getUserProgress,
    getRecentSessions,
    getQuestionsCount,
    savePracticeSession,
    isAdmin,
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};