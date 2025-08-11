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
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
}

interface QuestionSettings {
  topic: string;
  difficulty: string;
  questionCount: number;
  timedMode: boolean;
  customTimePerQuestion: number;
}

interface QuestionContextType {
  generateQuestions: (settings: QuestionSettings) => Promise<QuestionData[]>;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
  recordQuestionAttempt: (questionId: string, isCorrect: boolean) => Promise<void>;
  getUserProgress: () => Promise<any>;
  getRecentSessions: () => Promise<any[]>;
  getQuestionsCount: () => Promise<number>;
  isAdmin: () => Promise<boolean>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const generateQuestions = async (settings: QuestionSettings): Promise<QuestionData[]> => {
    try {
      console.log('🎯 Generating questions with settings:', settings);
      
      let questions: QuestionData[] = [];
      
      if (settings.topic === 'Mixed') {
        questions = await getRandomMixedQuestions(settings.questionCount, settings.difficulty);
      } else {
        questions = await getRandomQuestionsBySkill(settings.topic, settings.questionCount, settings.difficulty);
      }
      
      console.log(`✅ Generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      throw error;
    }
  };

  const getRandomQuestionsBySkill = async (topic: string, count: number, difficulty: string): Promise<QuestionData[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get questions that the user hasn't answered correctly yet
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          id,
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
          image_url
        `)
        .eq('topic', topic)
        .eq('difficulty', difficulty)
        .eq('is_active', true)
        .not('id', 'in', `(
          SELECT question_id 
          FROM user_question_attempts 
          WHERE user_id = '${user.user.id}' AND is_correct = true
        )`)
        .order('question_number');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!questions || questions.length === 0) {
        console.log(`⚠️ No new questions available for ${topic} (${difficulty})`);
        return [];
      }

      console.log(`📚 Found ${questions.length} unsolved questions for ${topic} (${difficulty})`);
      
      // Shuffle and take the requested count
      const shuffled = questions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, questions.length));
      
      console.log(`🎲 Selected ${selected.length} questions for practice`);

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
      console.error('Error fetching questions by skill:', error);
      throw error;
    }
  };

  const getRandomMixedQuestions = async (count: number, difficulty: string): Promise<QuestionData[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const topics = ['Algebra', 'Advanced Math', 'Problem Solving and Data Analysis', 'Geo/Trig'];
      const questionsPerTopic = Math.ceil(count / topics.length);
      
      let allQuestions: QuestionData[] = [];
      
      for (const topic of topics) {
        const { data: questions, error } = await supabase
          .from('questions')
          .select(`
            id,
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
            image_url
          `)
          .eq('topic', topic)
          .eq('difficulty', difficulty)
          .eq('is_active', true)
          .not('id', 'in', `(
            SELECT question_id 
            FROM user_question_attempts 
            WHERE user_id = '${user.user.id}' AND is_correct = true
          )`)
          .order('question_number')
          .limit(questionsPerTopic);

        if (error) {
          console.error(`Database error for topic ${topic}:`, error);
          continue;
        }

        if (questions && questions.length > 0) {
          console.log(`📚 Found ${questions.length} unsolved questions for ${topic} (${difficulty})`);
          
          const formattedQuestions = questions.map(q => ({
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
          
          allQuestions.push(...formattedQuestions);
        }
      }
      
      // Shuffle all questions and take the requested count
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, allQuestions.length));
      
      console.log(`🎲 Selected ${selected.length} mixed questions for practice`);
      return selected;
    } catch (error) {
      console.error('Error fetching mixed questions:', error);
      throw error;
    }
  };

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.user.id,
          topic: session.topic,
          difficulty: session.difficulty,
          total_questions: session.totalQuestions,
          correct_answers: session.correctAnswers,
          time_spent_seconds: session.timeSpentSeconds
        });

      if (error) throw error;
      console.log('✅ Practice session saved successfully');
    } catch (error) {
      console.error('❌ Error saving practice session:', error);
      throw error;
    }
  };

  const recordQuestionAttempt = async (questionId: string, isCorrect: boolean): Promise<void> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_question_attempts')
        .upsert({
          user_id: user.user.id,
          question_id: questionId,
          is_correct: isCorrect
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;
      console.log(`✅ Question attempt recorded: ${questionId} - ${isCorrect ? 'correct' : 'incorrect'}`);
    } catch (error) {
      console.error('❌ Error recording question attempt:', error);
      throw error;
    }
  };

  const getUserProgress = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  };

  const getRecentSessions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      throw error;
    }
  };

  const getQuestionsCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching questions count:', error);
      return 0;
    }
  };

  const isAdmin = async (): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      return user.user.email === 'rptestprepservices@gmail.com';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const value: QuestionContextType = {
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