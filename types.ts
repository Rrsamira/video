
export enum EditTool {
  SELECT = 'select',
  TRIM = 'trim',
  FILTER = 'filter',
  TEXT = 'text',
  AUDIO = 'audio',
  AI = 'ai'
}

export interface VideoClip {
  id: string;
  name: string;
  duration: number; // in seconds
  startTime: number;
  thumbnail: string;
  filter?: string; // This stores the filter ID
}

export interface ProjectState {
  name: string;
  clips: VideoClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  activeTool: EditTool;
  isPremium: boolean;
}

export interface AICommandResponse {
  action: string;
  description: string;
  parameters?: any;
}

export interface AIFilter {
  id: string;
  name: string;
  icon: string;
  category: string;
  tags: string[];
  description: string;
  style?: React.CSSProperties;
  premium?: boolean;
  new?: boolean;
}
