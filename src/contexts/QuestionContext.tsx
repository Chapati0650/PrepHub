import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface QuestionData {
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

interface QuestionContextType {
  generateQuestions: (settings: any) => Promise<QuestionData[]>;
  savePracticeSession: (session: PracticeSession) => Promise<void>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getRandomQuestionsBySkill = async (skill: string, count: number): Promise<QuestionData[]> => {
    try {
      const { data, error } = await supabase.rpc('get_random_questions_by_skill', {
        question_count: count,
        skill_name: skill
      });

      if (error) {
        console.error('Error getting random questions by skill:', error);
        throw error;
      }

      return data?.map((q: any) => ({
        id: q.id,
        question: q.question,
        questionType: q.question_type,
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
      })) || [];
    } catch (error) {
      console.error('Error in getRandomQuestionsBySkill:', error);
      return [];
    }
  };

  const generateQuestions = async (settings: any): Promise<QuestionData[]> => {
    try {
      if (settings.topic === 'Mixed') {
        const topics = ['Algebra', 'Advanced Math', 'Problem Solving and Data Analysis', 'Geo/Trig'];
        const questionsPerTopic = Math.ceil(settings.questionCount / topics.length);
        
        const allQuestions: QuestionData[] = [];
        for (const topic of topics) {
          const questions = await getRandomQuestionsBySkill(topic, questionsPerTopic);
          allQuestions.push(...questions);
        }
        
        return allQuestions.slice(0, settings.questionCount);
      } else {
        return await getRandomQuestionsBySkill(settings.topic, settings.questionCount);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  };

  const savePracticeSession = async (session: PracticeSession): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
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
          time_spent_seconds: session.timeSpentSeconds
        });

      if (error) {
        console.error('Error saving practice session:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in savePracticeSession:', error);
      throw error;
    }
  };

  const value: QuestionContextType = {
    generateQuestions,
    savePracticeSession
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