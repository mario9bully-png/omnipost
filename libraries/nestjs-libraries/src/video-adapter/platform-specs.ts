import { PlatformVideoSpec } from './video-adapter.types';

export const PLATFORM_SPECS: Record<string, PlatformVideoSpec> = {
  tiktok: {
    platform: 'tiktok', maxDurationSec: 600, maxFileSizeMb: 4096,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '9:16', maxWidth: 1080, maxHeight: 1920, maxBitrateKbps: 6000,
  },
  instagram: {
    platform: 'instagram', maxDurationSec: 90, maxFileSizeMb: 4096,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '9:16', maxWidth: 1080, maxHeight: 1920, maxBitrateKbps: 5000,
  },
  'youtube-shorts': {
    platform: 'youtube-shorts', maxDurationSec: 60, maxFileSizeMb: 4096,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '9:16', maxWidth: 1080, maxHeight: 1920, maxBitrateKbps: 8000,
  },
  'youtube-long': {
    platform: 'youtube-long', maxDurationSec: 43200, maxFileSizeMb: 128000,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '16:9', maxWidth: 3840, maxHeight: 2160, maxBitrateKbps: 20000,
  },
  telegram: {
    platform: 'telegram', maxDurationSec: 3600, maxFileSizeMb: 2048,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: 'any', maxWidth: 1920, maxHeight: 1920, maxBitrateKbps: 8000,
  },
  vk: {
    platform: 'vk', maxDurationSec: 7200, maxFileSizeMb: 5120,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: 'any', maxWidth: 1920, maxHeight: 1920, maxBitrateKbps: 8000,
  },
  ok: {
    platform: 'ok', maxDurationSec: 3600, maxFileSizeMb: 2048,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: 'any', maxWidth: 1920, maxHeight: 1920, maxBitrateKbps: 6000,
  },
  pinterest: {
    platform: 'pinterest', maxDurationSec: 900, maxFileSizeMb: 2048,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '9:16', maxWidth: 1080, maxHeight: 1920, maxBitrateKbps: 6000,
  },
  yappy: {
    platform: 'yappy', maxDurationSec: 60, maxFileSizeMb: 512,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '9:16', maxWidth: 1080, maxHeight: 1920, maxBitrateKbps: 5000,
  },
  dzen: {
    platform: 'dzen', maxDurationSec: 7200, maxFileSizeMb: 4096,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '16:9', maxWidth: 1920, maxHeight: 1080, maxBitrateKbps: 8000,
  },
  rutube: {
    platform: 'rutube', maxDurationSec: 7200, maxFileSizeMb: 4096,
    codec: 'h264', audioCodec: 'aac', container: 'mp4',
    aspectRatio: '16:9', maxWidth: 1920, maxHeight: 1080, maxBitrateKbps: 8000,
  },
};
