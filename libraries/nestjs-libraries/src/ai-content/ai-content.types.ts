export interface GenerationRequest {
  baseDescription: string;
  platforms: string[];
  niche?: string;
  tone?: 'formal' | 'casual' | 'bold';
  language?: 'ru' | 'en' | 'auto';
  blacklistWords?: string[];
  blacklistTags?: string[];
}

export interface PlatformContent {
  platform: string;
  description: string;
  hashtags: string[];
  title?: string;
}

export interface GenerationResult {
  contents: PlatformContent[];
  tokensUsed: number;
  model: string;
}

export interface PlatformStyle {
  platform: string;
  maxLength: number;
  style: string;
  hashtagLimit: number;
  includeTitle: boolean;
}
