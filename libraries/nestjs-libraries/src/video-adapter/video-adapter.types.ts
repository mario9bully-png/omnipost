export interface PlatformVideoSpec {
  platform: string;
  maxDurationSec: number;
  maxFileSizeMb: number;
  codec: string;
  audioCodec: string;
  container: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | 'any';
  maxWidth: number;
  maxHeight: number;
  maxBitrateKbps: number;
}

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  codec: string;
  audioCodec: string;
  fileSizeMb: number;
  container: string;
}

export interface AdaptationRequest {
  inputPath: string;
  platforms: string[];
  outputDir: string;
  trimStart?: number;
  trimEnd?: number;
  generateThumbnail?: boolean;
  thumbnailTimeSec?: number;
}

export interface AdaptationResult {
  platform: string;
  outputPath: string;
  thumbnailPath?: string;
  success: boolean;
  error?: string;
  durationMs: number;
}
