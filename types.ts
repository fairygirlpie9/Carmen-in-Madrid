export enum CharacterRole {
  NARRATOR = 'Narrator',
  CARMEN = 'Carmen', // The User
  MATEO = 'Mateo',
}

export interface DialogueLine {
  id: string;
  role: CharacterRole;
  spanish: string;
  english: string;
}

export interface Scene {
  id: string;
  title: string;
  location: string;
  ambience?: string; // URL for background audio
  images: string[]; // Array of URLs for this specific scene
  script: DialogueLine[];
}

export interface Episode {
  title: string;
  story: Scene[];
  culturalInsight: Scene;
  vocabulary: Scene;
}

export enum AppState {
  IDLE = 'IDLE',
  PLAYING_AUDIO = 'PLAYING_AUDIO',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  THINKING = 'THINKING', // New state for Chat processing
}

export enum SectionType {
  STORY = 'STORY',
  MENU = 'MENU', // The "Mission Report" / Hub
  INSIGHT = 'INSIGHT',
  VOCAB = 'VOCAB',
  CHAT = 'CHAT', // New Section
}

export interface DictionaryEntry {
  spanish: string;
  english: string;
  dateAdded: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mateo';
  spanish: string;
  english?: string; // User might not have translation immediately, but Mateo will
}