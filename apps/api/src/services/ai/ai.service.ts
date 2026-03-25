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
  private provider: IAIService;

  constructor() {
    // Development: Use Gemini Flash (free)
    // Production: Use Claude Sonnet (paid)
    if (process.env.NODE_ENV === 'production') {
      console.log('[AIService] Using Claude for production');
      this.provider = claudeService;
    } else {
      console.log('[AIService] Using Gemini for development');
      this.provider = geminiService;
    }
  }

  async generateContent(options: {
    tweetText: string;
    brandVoice?: string;
    draftId?: string;
  }): Promise<AiGeneratedContent> {
    return this.provider.generateContent(options);
  }

  async regenerateHeadline(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]> {
    return this.provider.regenerateHeadline(options);
  }

  async regenerateSubCaption(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    brandVoice?: string;
  }): Promise<string[]> {
    return this.provider.regenerateSubCaption(options);
  }

  async regenerateAllSlides(options: {
    draftId: string;
    currentHeadline: string;
    currentSubCaption: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<Array<{ position: number; copy: string }>> {
    return this.provider.regenerateAllSlides(options);
  }

  async repromptSlide(options: {
    draftId: string;
    slidePosition: number;
    currentCopy: string;
    tweetText: string;
    slideCount: number;
    brandVoice?: string;
  }): Promise<string> {
    return this.provider.repromptSlide(options);
  }
}

// Export singleton instance
export const aiService = new AIService();
