export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SCENARIO = 'SCENARIO',
  VOCABULARY = 'VOCABULARY',
  FLASHCARDS = 'FLASHCARDS',
  PROFILE = 'PROFILE'
}

export enum WordCategory {
  NOUN = 'noun',
  VERB = 'verb',
  ADJECTIVE = 'adjective',
  PHRASE = 'phrase'
}

export interface Word {
  id: string;
  german: string;
  ukrainian: string; // Acts as "native translation"
  category: WordCategory;
  exampleSentence?: string;
  masteryLevel: number; // 0-5
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  hint?: string; // Optional hint for user
}

export interface UserGoal {
  target: number;
  current: number;
  unit: string; // "words", "minutes"
}

export interface UserProfile {
  appLanguage: string;
  learningLanguage: string;
  level: string; // A1, A2, B1, B2, C1, C2
  goal: string;
  situation: string;
  challenges: string;
}
