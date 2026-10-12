// Arabic Font Loader for PDF Generation
export class ArabicFontLoader {
  private static fontData: string | null = null;
  private static fontLoaded = false;

  // Base64 encoded Noto Naskh Arabic font (subset for common Arabic characters)
  private static readonly FONT_BASE64 = `
    // This would contain the base64 encoded font data
    // For now, we'll use a placeholder approach
  `;

  static async loadFont(): Promise<string> {
    if (this.fontLoaded && this.fontData) {
      return this.fontData;
    }

    try {
      // Try to load from CDN first
      const response = await fetch('https://fonts.gstatic.com/s/notonaskharabic/v1/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z0w.woff2');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        this.fontData = this.arrayBufferToBase64(arrayBuffer);
        this.fontLoaded = true;
        console.log('Arabic font loaded successfully from CDN');
        return this.fontData;
      }
    } catch (error) {
      console.log('Failed to load Arabic font from CDN:', error);
    }

    // Fallback: Use a simple approach with Unicode support
    console.log('Using fallback Arabic text approach');
    return '';
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper function to check if text contains Arabic
  static containsArabic(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }

  // Helper function to get Arabic text direction
  static getTextDirection(text: string): 'rtl' | 'ltr' {
    return this.containsArabic(text) ? 'rtl' : 'ltr';
  }
}
