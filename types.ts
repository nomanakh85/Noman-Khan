
export enum AppView {
  LIVE_COMMENTATOR = 'Live Race Commentary',
  RACE_ENGINEER_CHAT = 'Race Engineer Chat',
  CAR_CUSTOMIZER = 'Car Customizer',
  RACE_HIGHLIGHTS = 'Race Highlights',
  POST_RACE_ANALYSIS = 'Post-Race Analysis',
  TEAM_RADIO = 'Team Radio',
  PIT_STOP_STRATEGY = 'Pit Stop Strategy',
  RACING_NEWS = 'Racing News',
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

// Declare aistudio property on Window
// FIX: Defined AIStudio interface within the global scope to resolve conflicting type declarations.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}
