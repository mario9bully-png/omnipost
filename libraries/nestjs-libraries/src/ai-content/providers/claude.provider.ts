import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider } from './llm.interface';

export class ClaudeLlmProvider implements LlmProvider {
  name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return {
      text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }
}
