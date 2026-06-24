import { create } from "zustand";

interface QuestionData {
  id: string;
  stems: string[];
  questionType: string;
  difficulty: string;
  options: { label: string; text: string; isCorrect: boolean }[] | null;
  correctAnswer: string;
  answerUnit: string | null;
  marks: number;
  explanation: string | null;
  topic: { id: string; name: string };
  subject: { id: string; name: string; code: string };
}

interface SessionData {
  id: string;
  mode: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  status: string;
}

interface PracticeState {
  // Session state
  session: SessionData | null;
  questions: QuestionData[];
  currentIndex: number;

  // Answer state
  userAnswer: string;
  lastResult: {
    isCorrect: boolean;
    correctAnswer?: string;
    answerUnit?: string | null;
    explanation?: string | null;
    responseId?: string;
  } | null;

  // AI Tutor state
  aiExplanation: string | null;
  aiLoading: boolean;

  // Actions
  setSession: (session: SessionData, questions: QuestionData[]) => void;
  setUserAnswer: (answer: string) => void;
  setLastResult: (result: PracticeState["lastResult"]) => void;
  nextQuestion: () => void;
  updateProgress: (answered: number, correct: number) => void;
  setAiExplanation: (text: string | null) => void;
  setAiLoading: (loading: boolean) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  session: null,
  questions: [],
  currentIndex: 0,
  userAnswer: "",
  lastResult: null,
  aiExplanation: null,
  aiLoading: false,

  setSession: (session, questions) =>
    set({ session, questions, currentIndex: 0, lastResult: null, aiExplanation: null }),

  setUserAnswer: (answer) => set({ userAnswer: answer }),

  setLastResult: (result) => set({ lastResult: result, aiExplanation: null }),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      userAnswer: "",
      lastResult: null,
      aiExplanation: null,
    })),

  updateProgress: (answered, correct) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, answeredCount: answered, correctCount: correct }
        : null,
    })),

  setAiExplanation: (text) => set({ aiExplanation: text }),
  setAiLoading: (loading) => set({ aiLoading: loading }),

  reset: () =>
    set({
      session: null,
      questions: [],
      currentIndex: 0,
      userAnswer: "",
      lastResult: null,
      aiExplanation: null,
      aiLoading: false,
    }),
}));
