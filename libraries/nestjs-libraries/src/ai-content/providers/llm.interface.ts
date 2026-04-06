export interface LlmProvider {
  name: string;
  generate(prompt: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }>;
}
