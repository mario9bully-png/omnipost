import OpenAI from 'openai';
import { LlmProvider } from './llm.interface';

export class OpenAILlmProvider implements LlmProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }
}
