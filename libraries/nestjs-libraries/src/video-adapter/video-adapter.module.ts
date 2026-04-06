import { Module } from '@nestjs/common';
import { VideoAdapterService } from './video-adapter.service';

@Module({
  providers: [VideoAdapterService],
  exports: [VideoAdapterService],
})
export class VideoAdapterModule {}
