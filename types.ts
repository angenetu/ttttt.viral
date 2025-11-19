export enum View {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  SCRIPT_AI = 'SCRIPT_AI',
  GROWTH = 'GROWTH',
  TEMPLATES = 'TEMPLATES',
  ASSISTANT = 'ASSISTANT',
  SETTINGS = 'SETTINGS'
}

export interface ScriptResult {
  title: string;
  hook: string;
  body: string;
  cta: string;
  estimatedViralScore: number;
  hashtags: string[];
}

export interface VideoProject {
  id: string;
  title: string;
  thumbnail: string;
  lastModified: string;
  status: 'draft' | 'rendering' | 'completed';
  duration: string;
  platform: 'tiktok' | 'youtube_shorts' | 'youtube_long';
}

export interface TrendItem {
  keyword: string;
  volume: number;
  growth: number;
  difficulty: 'Low' | 'Medium' | 'High';
}

export interface Template {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  tags: string[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}