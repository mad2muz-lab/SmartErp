import { LOCAL_CONVEX_URL } from './convexUrl';

/**
 * Logo handling utilities for invoice generation
 */

export interface LogoResult {
  success: boolean;
  logoUrl?: string;
  fallbackLogo?: string;
  error?: string;
}

export function getConvexStorageUrl(fileId: string): string {
  return new URL(`/api/storage/${fileId}`, LOCAL_CONVEX_URL).toString();
}

/**
 * Convert Convex file ID to accessible URL
 * Note: This is a fallback function. In production, use the proper Convex storage API
 */
export function convertFileIdToUrl(fileId: string | undefined): string | undefined {
  if (!fileId) return undefined;
  
  // If it's already a URL, return as is
  if (fileId.startsWith('http')) return fileId;
  
  // If it's a file ID, construct the Convex storage URL
  if (fileId.length > 10 && !fileId.includes('.')) {
    // This looks like a Convex file ID, construct the URL
    // Note: This is a fallback. Proper implementation should use ctx.storage.getUrl() in backend
    return getConvexStorageUrl(fileId);
  }
  
  return fileId;
}

/**
 * Test if a logo URL is accessible
 */
export async function testLogoUrl(logoUrl: string): Promise<boolean> {
  try {
    const response = await fetch(logoUrl, { 
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.warn('Logo URL test failed:', error);
    return false;
  }
}

/**
 * Get logo with fallback handling
 */
export async function getLogoWithFallback(logoUrl: string | undefined): Promise<LogoResult> {
  if (!logoUrl) {
    return {
      success: false,
      fallbackLogo: 'RAWASI',
      error: 'No logo URL provided'
    };
  }

  const convertedUrl = convertFileIdToUrl(logoUrl);
  if (!convertedUrl) {
    return {
      success: false,
      fallbackLogo: 'RAWASI',
      error: 'Failed to convert file ID to URL'
    };
  }

  // Test if the logo URL is accessible
  const isAccessible = await testLogoUrl(convertedUrl);
  
  if (isAccessible) {
    return {
      success: true,
      logoUrl: convertedUrl
    };
  } else {
    return {
      success: false,
      fallbackLogo: 'RAWASI',
      error: 'Logo URL not accessible'
    };
  }
}

/**
 * Generate fallback logo HTML - Simple placeholder without yellow styling
 */
export function generateFallbackLogoHTML(companyName: string = 'RAWASI'): string {
  return `
    <div style="
      width: 120px; 
      height: 80px; 
      background: #f8f9fa; 
      border: 1px solid #dee2e6; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 10px; 
      color: #6c757d; 
      margin: 0 auto; 
      border-radius: 4px; 
      font-weight: normal;
    ">
      No Logo
    </div>
  `;
}

/**
 * Generate logo HTML with fallback
 */
export function generateLogoHTML(logoUrl: string | undefined, companyName: string = 'RAWASI'): string {
  if (!logoUrl) {
    return generateFallbackLogoHTML(companyName);
  }

  const convertedUrl = convertFileIdToUrl(logoUrl);
  if (!convertedUrl) {
    return generateFallbackLogoHTML(companyName);
  }

  return `
    <img src="${convertedUrl}" 
         alt="Company Logo" 
         style="max-width: 120px; max-height: 80px; object-fit: contain; display: block; margin: 0 auto;" 
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
    <div style="display: none;">
      ${generateFallbackLogoHTML(companyName)}
    </div>
  `;
}
