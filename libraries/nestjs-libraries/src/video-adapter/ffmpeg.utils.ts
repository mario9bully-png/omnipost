import { exec } from 'child_process';
import { promisify } from 'util';
import { PlatformVideoSpec, VideoMetadata } from './video-adapter.types';

const execAsync = promisify(exec);

export async function probeVideo(inputPath: string): Promise<VideoMetadata> {
  const { stdout } = await execAsync(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`
  );
  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
  const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');

  return {
    durationSec: parseFloat(data.format?.duration || '0'),
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    codec: videoStream?.codec_name || 'unknown',
    audioCodec: audioStream?.codec_name || 'unknown',
    fileSizeMb: parseFloat(data.format?.size || '0') / (1024 * 1024),
    container: data.format?.format_name || 'unknown',
  };
}

export function buildFfmpegCommand(
  inputPath: string,
  outputPath: string,
  source: VideoMetadata,
  spec: PlatformVideoSpec,
  trimStart?: number,
  trimEnd?: number
): string {
  const args: string[] = ['ffmpeg', '-y', '-i', `"${inputPath}"`];

  if (trimStart !== undefined) args.push(`-ss ${trimStart}`);
  if (trimEnd !== undefined) {
    args.push(`-to ${trimEnd}`);
  } else if (source.durationSec > spec.maxDurationSec) {
    args.push(`-t ${spec.maxDurationSec}`);
  }

  // Video codec — always re-encode if resizing
  const targetSize = getTargetSize(source, spec);
  const needsReencode = source.codec !== spec.codec || !!targetSize;

  if (needsReencode) {
    args.push('-c:v libx264 -preset medium -crf 23');
  } else {
    args.push('-c:v copy');
  }

  if (targetSize) {
    args.push(
      `-vf "scale=${targetSize.width}:${targetSize.height}:force_original_aspect_ratio=decrease,pad=${targetSize.width}:${targetSize.height}:(ow-iw)/2:(oh-ih)/2:black"`
    );
  }

  args.push(`-maxrate ${spec.maxBitrateKbps}k -bufsize ${spec.maxBitrateKbps * 2}k`);

  if (source.audioCodec !== spec.audioCodec) {
    args.push('-c:a aac -b:a 128k');
  } else {
    args.push('-c:a copy');
  }

  args.push('-movflags +faststart');
  args.push(`"${outputPath}"`);

  return args.join(' ');
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timeSec: number
): Promise<void> {
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -ss ${timeSec} -vframes 1 -q:v 2 "${outputPath}"`
  );
}

function getTargetSize(
  source: VideoMetadata,
  spec: PlatformVideoSpec
): { width: number; height: number } | null {
  if (spec.aspectRatio === 'any') {
    // Only resize if over max dimensions
    if (source.width <= spec.maxWidth && source.height <= spec.maxHeight) return null;
    const scale = Math.min(spec.maxWidth / source.width, spec.maxHeight / source.height);
    let w = Math.round(source.width * scale);
    let h = Math.round(source.height * scale);
    w = w % 2 === 0 ? w : w - 1;
    h = h % 2 === 0 ? h : h - 1;
    return { width: w, height: h };
  }

  const [aw, ah] = spec.aspectRatio.split(':').map(Number);
  const targetRatio = aw / ah;
  const sourceRatio = source.width / source.height;

  if (
    Math.abs(sourceRatio - targetRatio) < 0.05 &&
    source.width <= spec.maxWidth &&
    source.height <= spec.maxHeight
  ) {
    return null;
  }

  let width: number;
  let height: number;

  if (targetRatio > 1) {
    width = Math.min(source.width, spec.maxWidth);
    height = Math.round(width / targetRatio);
  } else {
    height = Math.min(source.height, spec.maxHeight);
    width = Math.round(height * targetRatio);
  }

  width = width % 2 === 0 ? width : width - 1;
  height = height % 2 === 0 ? height : height - 1;

  return { width, height };
}
