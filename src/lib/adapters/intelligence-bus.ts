import { opacusClient } from './opacus';
import { mycaProvider } from './myca';
import { getAIProvider } from '../ai/provider';

export class IntelligenceBus {
  /**
   * Universal generate call. Routes to:
   * 1. Myca (if configured & local/colony computed)
   * 2. Opacus (if configured for autonomous task proofing)
   * 3. Fallback to standard OpenAI provider
   */
  static async generate(prompt: string, systemPrompt?: string): Promise<string> {
    if (mycaProvider.isConfigured) {
      try {
        return await mycaProvider.inference(prompt);
      } catch (err) {
        console.warn('[IntelligenceBus] Myca inference failed, falling back:', err);
      }
    }
    
    // Default fallback to configured LLM provider (OpenAI)
    const ai = getAIProvider();
    return await ai.generate(prompt, systemPrompt);
  }
}
