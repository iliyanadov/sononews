import { AiGeneratedContent } from '@sononews/shared';
import { claudeService } from './claude.service';
import { geminiService } from './gemini.service';

// Interface for AI service operations
interface IAIService {
  generateContent(options: {
    tweetText: string;
    brandVoice?: string;
    draftId?: string;
  }): Promise<AiGeneratedContent>;

  regenerateHeadline(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]>;

  regenerateSubCaption(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]>;

  regenerateAllSlides(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<Array<{ position: number; copy: string }>>;

  repromptSlide(options: {
    draftId: string;
    slidePosition: number;
    currentCopy: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<string>;
}

class AIService implements IAIService {
  private primaryProvider: IAIService;
  private fallbackProvider: IAIService;
  private primaryProviderName: string;
  private fallbackProviderName: string;
  private lastFailedProvider: string | null = null;
  private lastFailureTime: number = 0;
  private FAILURE_CACHE_DURATION = 60000; // 1 minute

  constructor() {
    // Development: Gemini primary, Claude fallback
    // Production: Claude primary, Gemini fallback
    if (process.env.NODE_ENV === 'production') {
      this.primaryProvider = claudeService;
      this.fallbackProvider = geminiService;
      this.primaryProviderName = 'Claude';
      this.fallbackProviderName = 'Gemini';
      console.log('[AIService] Primary: Claude (production), Fallback: Gemini');
    } else {
      this.primaryProvider = geminiService;
      this.fallbackProvider = claudeService;
      this.primaryProviderName = 'Gemini';
      this.fallbackProviderName = 'Claude';
      console.log('[AIService] Primary: Gemini (development), Fallback: Claude');
    }
  }

  /**
   * Check if an error indicates we should try the fallback provider
   */
  private shouldFallback(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || String(error);
    const errorCode = error.status || error.statusCode;

    // Fallback on quota exceeded, rate limits, or service unavailable
    const fallbackPatterns = [
      'quota exceeded',
      'rate limit',
      'too many requests',
      'service unavailable',
      'high demand',
    ];

    const hasPattern = fallbackPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern)
    );

    // Check for HTTP status codes that indicate we should fallback
    const hasStatusCode = errorCode === 429 || errorCode === 503;

    return hasPattern || hasStatusCode;
  }

  /**
   * Check if we should skip the primary provider based on recent failures
   */
  private shouldSkipPrimary(): boolean {
    if (!this.lastFailedProvider || !this.lastFailureTime) return false;

    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return (
      this.lastFailedProvider === this.primaryProviderName &&
      timeSinceFailure < this.FAILURE_CACHE_DURATION
    );
  }

  /**
   * Record a provider failure
   */
  private recordFailure(providerName: string): void {
    this.lastFailedProvider = providerName;
    this.lastFailureTime = Date.now();
  }

  /**
   * Execute an operation with automatic fallback
   */
  private async executeWithFallback<T>(
    operation: string,
    options: any,
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    // Try primary provider first (unless it recently failed)
    if (!this.shouldSkipPrimary()) {
      try {
        const result = await primaryFn();
        // Clear failure cache on success
        if (this.lastFailedProvider === this.primaryProviderName) {
          this.lastFailedProvider = null;
          this.lastFailureTime = 0;
        }
        return result;
      } catch (error) {
        if (this.shouldFallback(error)) {
          console.log(
            `[AIService] ${operation} failed with ${this.primaryProviderName}:`,
            error.message || String(error)
          );
          console.log(`[AIService] Falling back to ${this.fallbackProviderName}...`);
          this.recordFailure(this.primaryProviderName);
        } else {
          // Not a fallback-worthy error, re-throw
          throw error;
        }
      }
    } else {
      console.log(
        `[AIService] Skipping ${this.primaryProviderName} (recent failure), using ${this.fallbackProviderName} directly`
      );
    }

    // Try fallback provider
    try {
      const result = await fallbackFn();
      console.log(`[AIService] Successfully used ${this.fallbackProviderName} fallback`);
      return result;
    } catch (fallbackError) {
      console.error(
        `[AIService] ${operation} also failed with ${this.fallbackProviderName}:`,
        fallbackError.message || String(fallbackError)
      );
      this.recordFailure(this.fallbackProviderName);
      throw fallbackError;
    }
  }

  async generateContent(options: {
    tweetText: string;
    brandVoice?: string;
    draftId?: string;
  }): Promise<AiGeneratedContent> {
    return this.executeWithFallback(
      'Content generation',
      options,
      () => this.primaryProvider.generateContent(options),
      () => this.fallbackProvider.generateContent(options)
    );
  }

  async regenerateHeadline(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]> {
    return this.executeWithFallback(
      'Headline regeneration',
      options,
      () => this.primaryProvider.regenerateHeadline(options),
      () => this.fallbackProvider.regenerateHeadline(options)
    );
  }

  async regenerateSubCaption(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]> {
    return this.executeWithFallback(
      'Sub-caption regeneration',
      options,
      () => this.primaryProvider.regenerateSubCaption(options),
      () => this.fallbackProvider.regenerateSubCaption(options)
    );
  }

  async regenerateAllSlides(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<Array<{ position: number; copy: string }>> {
    return this.executeWithFallback(
      'Slide regeneration',
      options,
      () => this.primaryProvider.regenerateAllSlides(options),
      () => this.fallbackProvider.regenerateAllSlides(options)
    );
  }

  async repromptSlide(options: {
    draftId: string;
    slidePosition: number;
    currentCopy: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<string> {
    return this.executeWithFallback(
      'Slide reprompt',
      options,
      () => this.primaryProvider.repromptSlide(options),
      () => this.fallbackProvider.repromptSlide(options)
    );
  }
}

// Export singleton instance
export const aiService = new AIService();
