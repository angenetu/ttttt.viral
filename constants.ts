import { VideoProject, Template, TrendItem } from './types';

export const MOCK_PROJECTS: VideoProject[] = [
  {
    id: '1',
    title: 'Top 10 AI Tools 2024',
    thumbnail: 'https://picsum.photos/400/225?random=1',
    lastModified: '2 hours ago',
    status: 'draft',
    duration: '0:59',
    platform: 'tiktok'
  },
  {
    id: '2',
    title: 'Day in the Life of a Dev',
    thumbnail: 'https://picsum.photos/400/225?random=2',
    lastModified: '1 day ago',
    status: 'completed',
    duration: '12:30',
    platform: 'youtube_long'
  },
  {
    id: '3',
    title: 'Coding ASMR',
    thumbnail: 'https://picsum.photos/400/225?random=3',
    lastModified: '3 days ago',
    status: 'completed',
    duration: '0:45',
    platform: 'youtube_shorts'
  }
];

export const MOCK_TEMPLATES: Template[] = [
  { id: 't1', name: 'Tech Review Fast', category: 'Tech', previewUrl: 'https://picsum.photos/300/500?random=10', tags: ['Tech', 'Fast'] },
  { id: 't2', name: 'Lifestyle Vlog', category: 'Vlog', previewUrl: 'https://picsum.photos/300/500?random=11', tags: ['Vlog', 'Chill'] },
  { id: 't3', name: 'Gaming Highlights', category: 'Gaming', previewUrl: 'https://picsum.photos/300/500?random=12', tags: ['Gaming', 'Action'] },
  { id: 't4', name: 'Finance Tips', category: 'Educational', previewUrl: 'https://picsum.photos/300/500?random=13', tags: ['Money', 'Tips'] },
  { id: 't5', name: 'Cinematic Travel', category: 'Travel', previewUrl: 'https://picsum.photos/300/500?random=14', tags: ['Travel', 'Cinematic'] },
  { id: 't6', name: 'Fitness Motivation', category: 'Health', previewUrl: 'https://picsum.photos/300/500?random=15', tags: ['Fitness', 'Gym'] },
];

export const MOCK_TRENDS: TrendItem[] = [
  { keyword: 'AI Agents', volume: 85000, growth: 120, difficulty: 'Medium' },
  { keyword: 'React 19', volume: 45000, growth: 85, difficulty: 'Low' },
  { keyword: 'Silent Reviews', volume: 1200000, growth: 300, difficulty: 'High' },
  { keyword: 'Slow Living', volume: 60000, growth: 45, difficulty: 'Medium' },
];

export const SUPPORTED_LANGUAGES = [
  "English",
  "Amharic",
  "Spanish",
  "French",
  "German",
  "Chinese (Mandarin)",
  "Japanese",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Russian",
  "Indonesian",
  "Swahili",
  "Bengali",
  "Korean",
  "Italian",
  "Turkish",
  "Dutch",
  "Polish",
  "Vietnamese",
  "Thai"
];