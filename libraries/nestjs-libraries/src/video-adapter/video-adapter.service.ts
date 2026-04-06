import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AdaptationRequest, AdaptationResult, VideoMetadata, PlatformVideoSpec } from './video-adapter.types';
import { PLATFORM_SPECS } from './platform-specs';
import { probeVideo, buildFfmpegCommand, generateThumbnail } from './ffmpeg.utils';

const execAsync = promisify(exec);

@Injectable()
export class VideoAdapterService {
  private readonly logger = new Logger(VideoAdapterService.name);

  async probe(inputPath: string): Promise<VideoMetadata> {
    return probeVideo(inputPath);
  }

  async validate(inputPath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      const meta = await probeVideo(inputPath);
      if (meta.durationSec > 10800) errors.push('Video exceeds 3 hour limit');
      if (meta.fileSizeMb > 4096) errors.push('File exceeds 4GB limit');
      if (meta.width === 0 || meta.height === 0) errors.push('Cannot detect video dimensions');
    } catch (err: any) {
      errors.push(`Cannot read video file: ${err.message}`);
    }
    return { valid: errors.length === 0, errors };
  }

  async adapt(request: AdaptationRequest): Promise<AdaptationResult[]> {
    const results: AdaptationResult[] = [];
    const source = await probeVideo(request.inputPath);

    await fs.mkdir(request.outputDir, { recursive: true });

    for (const platform of request.platforms) {
      const spec = PLATFORM_SPECS[platform];
      if (!spec) {
        results.push({
          platform, outputPath: '', success: false,
          error: `Unknown platform: ${platform}`, durationMs: 0,
        });
        continue;
      }

      const startTime = Date.now();
      const outputPath = path.join(request.outputDir, `${platform}.${spec.container}`);

      try {
        const needsWork = this.needsAdaptation(source, spec);

        if (!needsWork) {
          await fs.copyFile(request.inputPath, outputPath);
        } else {
          const cmd = buildFfmpegCommand(
            request.inputPath, outputPath, source, spec,
            request.trimStart, request.trimEnd
          );
          this.logger.log(`FFmpeg [${platform}]: ${cmd}`);
          await execAsync(cmd, { timeout: 600000 });
        }

        let thumbnailPath: string | undefined;
        if (request.generateThumbnail) {
          thumbnailPath = path.join(request.outputDir, `${platform}-thumb.jpg`);
          const thumbTime = request.thumbnailTimeSec ?? Math.min(source.durationSec * 0.1, 5);
          await generateThumbnail(request.inputPath, thumbnailPath, thumbTime);
        }

        results.push({
          platform, outputPath, thumbnailPath,
          success: true, durationMs: Date.now() - startTime,
        });
      } catch (err: any) {
        this.logger.error(`FFmpeg [${platform}] failed: ${err.message}`);
        results.push({
          platform, outputPath: '', success: false,
          error: err.message, durationMs: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  private needsAdaptation(source: VideoMetadata, spec: PlatformVideoSpec): boolean {
    if (source.codec !== spec.codec) return true;
    if (source.audioCodec !== spec.audioCodec) return true;
    if (source.durationSec > spec.maxDurationSec) return true;
    if (source.fileSizeMb > spec.maxFileSizeMb) return true;
    if (source.width > spec.maxWidth || source.height > spec.maxHeight) return true;

    if (spec.aspectRatio !== 'any') {
      const [aw, ah] = spec.aspectRatio.split(':').map(Number);
      const targetRatio = aw / ah;
      const sourceRatio = source.width / source.height;
      if (Math.abs(sourceRatio - targetRatio) > 0.05) return true;
    }

    return false;
  }
}
