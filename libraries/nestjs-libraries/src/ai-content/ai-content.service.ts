import { Injectable, Logger } from '@nestjs/common';
import { LlmProvider } from './providers/llm.interface';
import { ClaudeLlmProvider } from './providers/claude.provider';
import { OpenAILlmProvider } from './providers/openai.provider';
import { GenerationRequest, GenerationResult, PlatformContent } from './ai-content.types';
import { buildGenerationPrompt } from './platform-prompts';

@Injectable()
export class AiContentService {
  private readonly logger = new Logger(AiContentService.name);
  private provider: LlmProvider;

  constructor() {
    const llmProvider = process.env.AI_PROVIDER || 'claude';
    if (llmProvider === 'openai' && process.env.OPENAI_API_KEY) {
      this.provider = new OpenAILlmProvider(process.env.OPENAI_API_KEY);
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.provider = new ClaudeLlmProvider(process.env.ANTHROPIC_API_KEY);
    } else {
      this.logger.warn('No AI API key configured — AI content generation disabled.');
      this.provider = {
        name: 'noop',
        generate: async () => ({ text: '{"contents":[]}', tokensUsed: 0 }),
      };
    }
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const prompt = buildGenerationPrompt(
      request.baseDescription,
      request.platforms,
      request.niche,
      request.tone,
      request.language,
      request.blacklistWords,
      request.blacklistTags
    );

    const { text, tokensUsed } = await this.provider.generate(prompt, 4000);

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    let contents: PlatformContent[] = [];

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        contents = parsed.contents || [];
      } catch {
        this.logger.error('Failed to parse AI response JSON');
        contents = request.platforms.map((p) => ({
          platform: p,
          description: request.baseDescription,
          hashtags: [],
        }));
      }
    }

    return { contents, tokensUsed, model: this.provider.name };
  }
}
