import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiGeneratedContent } from '@sononews/shared';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MODEL = 'gemini-2.0-flash-lite'; // Lightweight model with separate quota

interface GenerateContentOptions {
  tweetText: string;
  brandVoice?: string;
  draftId?: string;
}

interface RegenerateOptions {
  draftId: string;
  currentHeadline: string;
  currentSubCaption: string;
  tweetText: string;
  brandVoice?: string;
}

interface RepromptSlideOptions {
  draftId: string;
  slidePosition: number;
  currentCopy: string;
  tweetText: string;
  slideCount: number;
  brandVoice?: string;
}

class GeminiService {
  private async logAiCall(draftId: string | null, prompt: string, response: string, model: string) {
    try {
      await prisma.aiLog.create({
        data: {
          draftId,
          prompt,
          response,
          model,
        },
      });
    } catch (error) {
      console.error('[GeminiService] Failed to log AI call:', error);
    }
  }

  async generateContent(options: GenerateContentOptions): Promise<AiGeneratedContent> {
    const { tweetText, brandVoice, draftId } = options;

    const brandVoiceContext = brandVoice
      ? `\nBrand Voice Guidelines:\n${brandVoice}\n`
      : '\nBrand Voice: Energetic, hip-hop culture focused, contemporary youth audience.\n';

    const prompt = `You are a content generator for Instagram carousel posts.

${brandVoiceContext}

Task: Analyze this tweet and generate carousel content.

Tweet:
"${tweetText}"

Requirements:
1. Generate 3 headline options (catchy, click-worthy, under 80 chars each)
2. Generate 3 sub-caption options (engaging, provides context, under 150 chars each)
3. Recommend optimal slide count (5-10 slides based on content depth)
4. Generate extension slides (slides 2+ with engaging copy, facts, or context)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "headlines": ["headline1", "headline2", "headline3"],
  "subCaptions": ["caption1", "caption2", "caption3"],
  "recommendedSlideCount": 7,
  "extensionSlides": [
    {"position": 2, "copy": "Slide 2 content"},
    {"position": 3, "copy": "Slide 3 content"}
  ]
}

Rules for extension slides:
- Start at position 2 (position 1 is cover with headline)
- Each slide should have 1-2 sentences max
- Include: key facts, artist background, context, or call-to-action
- Keep it conversational and Instagram-friendly`;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Log the AI call
      await this.logAiCall(draftId || null, prompt, responseText, MODEL);

      // Parse JSON from response (handle potential markdown code blocks)
      let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*?\})/);

      if (!jsonMatch) {
        // Try to extract just the JSON object
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonMatch = [responseText.slice(firstBrace, lastBrace + 1)];
        }
      }

      if (!jsonMatch) {
        console.error('[GeminiService] Failed to parse response:', responseText);
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[1]) as AiGeneratedContent;

      // Validate response structure
      if (!parsed.headlines || !Array.isArray(parsed.headlines)) {
        throw new Error('Invalid response: headlines must be an array');
      }
      if (!parsed.subCaptions || !Array.isArray(parsed.subCaptions)) {
        throw new Error('Invalid response: subCaptions must be an array');
      }
      if (!parsed.recommendedSlideCount) {
        throw new Error('Invalid response: recommendedSlideCount required');
      }
      if (!parsed.extensionSlides || !Array.isArray(parsed.extensionSlides)) {
        throw new Error('Invalid response: extensionSlides must be an array');
      }

      return parsed;
    } catch (error) {
      console.error('[GeminiService] Content generation failed:', error);
      throw error;
    }
  }

  async regenerateHeadline(options: RegenerateOptions): Promise<string[]> {
    const { currentHeadline, currentSubCaption, tweetText, brandVoice, draftId } = options;

    const prompt = `You are regenerating headline options for an Instagram carousel.

Current headline: "${currentHeadline}"
Current sub-caption: "${currentSubCaption}"

Original tweet:
"${tweetText}"

${brandVoice ? `Brand Voice:\n${brandVoice}` : 'Brand Voice: Energetic, hip-hop culture focused.'}

Generate 3 NEW headline options that are different from the current one.
Keep them catchy, click-worthy, and under 80 characters each.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "headlines": ["option1", "option2", "option3"]
}`;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      await this.logAiCall(draftId, prompt, responseText, MODEL);

      let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*?\})/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[1]);

      if (!parsed.headlines || !Array.isArray(parsed.headlines)) {
        throw new Error('Invalid response structure');
      }

      return parsed.headlines;
    } catch (error) {
      console.error('[GeminiService] Headline regeneration failed:', error);
      throw error;
    }
  }

  async regenerateSubCaption(options: RegenerateOptions): Promise<string[]> {
    const { currentHeadline, currentSubCaption, tweetText, brandVoice, draftId } = options;

    const prompt = `You are regenerating sub-caption options for an Instagram carousel.

Current headline: "${currentHeadline}"
Current sub-caption: "${currentSubCaption}"

Original tweet:
"${tweetText}"

${brandVoice ? `Brand Voice:\n${brandVoice}` : 'Brand Voice: Energetic, hip-hop culture focused.'}

Generate 3 NEW sub-caption options that are different from the current one.
Keep them engaging, informative, and under 150 characters each.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "subCaptions": ["option1", "option2", "option3"]
}`;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      await this.logAiCall(draftId, prompt, responseText, MODEL);

      let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*?\})/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[1]);

      if (!parsed.subCaptions || !Array.isArray(parsed.subCaptions)) {
        throw new Error('Invalid response structure');
      }

      return parsed.subCaptions;
    } catch (error) {
      console.error('[GeminiService] Sub-caption regeneration failed:', error);
      throw error;
    }
  }

  async regenerateAllSlides(options: RegenerateOptions & { slideCount: number }): Promise<Array<{ position: number; copy: string }>> {
    const { tweetText, brandVoice, draftId, slideCount } = options;

    const prompt = `You are regenerating all content slides for an Instagram carousel about hip-hop news.

Original tweet:
"${tweetText}"

Target slide count: ${slideCount} slides (excluding cover slide)

${brandVoice ? `Brand Voice:\n${brandVoice}` : 'Brand Voice: Energetic, hip-hop culture focused.'}

Generate engaging copy for ${slideCount} slides (positions 2-${slideCount + 1}).
Each slide should have 1-2 sentences max.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "slides": [
    {"position": 2, "copy": "Slide content"},
    {"position": 3, "copy": "Slide content"}
  ]
}`;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      await this.logAiCall(draftId, prompt, responseText, MODEL);

      let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*?\})/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[1]);

      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid response structure');
      }

      return parsed.slides;
    } catch (error) {
      console.error('[GeminiService] Slide regeneration failed:', error);
      throw error;
    }
  }

  async repromptSlide(options: RepromptSlideOptions): Promise<string> {
    const { slidePosition, currentCopy, tweetText, slideCount, brandVoice, draftId } = options;

    const prompt = `You are improving a single slide in an Instagram carousel about hip-hop news.

Original tweet:
"${tweetText}"

Current slide (position ${slidePosition}): "${currentCopy}"
Total slides in carousel: ${slideCount}

${brandVoice ? `Brand Voice:\n${brandVoice}` : 'Brand Voice: Energetic, hip-hop culture focused.'}

The user wasn't satisfied with this slide. Generate a BETTER version.
Keep it to 1-2 sentences max, engaging and informative.

Respond ONLY with the slide copy text (no JSON, no formatting).`;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const newCopy = result.response.text();

      await this.logAiCall(draftId, prompt, newCopy, MODEL);

      return newCopy;
    } catch (error) {
      console.error('[GeminiService] Slide reprompt failed:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
