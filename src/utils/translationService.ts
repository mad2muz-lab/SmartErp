// Translation Service for Arabic Support
// Using Free Translation API (MyMemory) for English to Arabic translation

interface TranslationCache {
  [key: string]: string;
}

// In-memory cache to avoid re-translating the same text
const translationCache: TranslationCache = {};

export class TranslationService {
  private static instance: TranslationService;

  private constructor() {}

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Translate English text to Arabic using MyMemory Free Translation API
   * No API key required, completely free
   */
  async translateToArabic(englishText: string): Promise<string> {
    // Return empty string if input is empty
    if (!englishText || englishText.trim() === '') {
      return '';
    }

    // Check cache first
    const cacheKey = `en-ar:${englishText.toLowerCase().trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      // Using MyMemory Free Translation API
      const encodedText = encodeURIComponent(englishText);
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|ar`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        
        // Only cache if translation quality is good
        if (data.responseStatus === 200) {
          translationCache[cacheKey] = translatedText;
        }
        
        return translatedText;
      }

      throw new Error('Invalid response format from translation API');
    } catch (error) {
      console.error('Translation error:', error);
      
      // Graceful fallback: return empty string
      return '';
    }
  }

  /**
   * Translate Arabic text to English using MyMemory Free Translation API
   * No API key required, completely free
   */
  async translateToEnglish(arabicText: string): Promise<string> {
    // Return empty string if input is empty
    if (!arabicText || arabicText.trim() === '') {
      return '';
    }

    // Check cache first
    const cacheKey = `ar-en:${arabicText.trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      // Using MyMemory Free Translation API
      const encodedText = encodeURIComponent(arabicText);
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ar|en`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        
        // Only cache if translation quality is good
        if (data.responseStatus === 200) {
          translationCache[cacheKey] = translatedText;
        }
        
        return translatedText;
      }

      throw new Error('Invalid response format from translation API');
    } catch (error) {
      console.error('Translation error:', error);
      
      // Graceful fallback: return empty string
      return '';
    }
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslateToArabic(englishTexts: string[]): Promise<string[]> {
    const translations = await Promise.all(
      englishTexts.map(text => this.translateToArabic(text))
    );
    return translations;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    Object.keys(translationCache).forEach(key => {
      delete translationCache[key];
    });
  }

  /**
   * Check if translation service is available
   */
  isAvailable(): boolean {
    return true; // MyMemory API is always available (no API key required)
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();

// Utility function for easy access
export const translateToArabic = (englishText: string): Promise<string> => {
  return translationService.translateToArabic(englishText);
};

// Utility function for Arabic to English translation
export const translateToEnglish = (arabicText: string): Promise<string> => {
  return translationService.translateToEnglish(arabicText);
};

// Utility function for batch translation
export const batchTranslateToArabic = (englishTexts: string[]): Promise<string[]> => {
  return translationService.batchTranslateToArabic(englishTexts);
};
