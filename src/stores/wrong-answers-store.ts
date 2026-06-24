import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WrongAnswer {
  id: string;
  questionId: string;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  answerUnit: string | null;
  explanation: string | null;
  topicId: string;
  topicName: string;
  parentName: string | null;
  date: string;
}

interface WrongAnswersState {
  answers: WrongAnswer[];
  addWrongAnswer: (answer: WrongAnswer) => void;
  removeAnswer: (id: string) => void;
  clearTopic: (topicId: string) => void;
  getByTopic: () => Map<string, WrongAnswer[]>;
}

export const useWrongAnswersStore = create<WrongAnswersState>()(
  persist(
    (set, get) => ({
      answers: [],

      addWrongAnswer: (answer) =>
        set((state) => ({
          answers: [answer, ...state.answers],
        })),

      removeAnswer: (id) =>
        set((state) => ({
          answers: state.answers.filter((a) => a.id !== id),
        })),

      clearTopic: (topicId) =>
        set((state) => ({
          answers: state.answers.filter((a) => a.topicId !== topicId),
        })),

      getByTopic: () => {
        const map = new Map<string, WrongAnswer[]>();
        for (const a of get().answers) {
          const key = a.topicId;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(a);
        }
        return map;
      },
    }),
    {
      name: "cie-physics-wrong-answers",
    }
  )
);
