



interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
}

import { getAuthConfig, getOAuthParams } from './shared/authConfig';
import { LOCAL_CONVEX_URL } from './convexUrl';

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private appUrl: string;
  private readonly processingFlagKey = 'google-auth-callback-processing';

  constructor() {
    const config = getAuthConfig();
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.appUrl = config.appUrl;
    
    if (!this.clientId) {
      console.error('❌ Google Client ID not found in environment variables');
      console.log('Available env vars:', Object.keys(import.meta.env));
    } else {
      console.log('✅ Google OAuth configured successfully');
      console.log('🔗 Redirect URI:', this.redirectUri);
      console.log('🌐 App URL:', this.appUrl);
    }
  }

  /**
   * Generate Google OAuth URL for authentication
   */
  getAuthUrl(): string {
    const params = new URLSearchParams(getOAuthParams());
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens (via server-side Convex action)
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleUser> {
    // Import Convex client and API dynamically to avoid circular dependencies
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('../../convex/_generated/api');
    const client = new ConvexHttpClient(LOCAL_CONVEX_URL);
    
    const result = await client.action(api.googleAuth.exchangeGoogleAuthCode, {
      code,
      redirect_uri: this.redirectUri,
    });

    if (!result.success || !result.user) {
      throw new Error(result.error || 'Failed to exchange code for tokens');
    }

    return result.user;
  }



  /**
   * Initiate Google OAuth login
   */
  login(): void {
    window.location.href = this.getAuthUrl();
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string): Promise<GoogleUser> {
    // Check if another callback is already being processed
    const isProcessing = sessionStorage.getItem(this.processingFlagKey);
    if (isProcessing) {
      throw new Error('OAuth callback already in progress');
    }

    // Additional check: if we already have a user stored, don't process again
    const storedUser = localStorage.getItem('google_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🏠 User already authenticated in Google Auth service');
        return parsedUser;
      } catch (e) {
        // Invalid stored data, clear it and continue
        localStorage.removeItem('google_user');
      }
    }

    // Set processing flag
    sessionStorage.setItem(this.processingFlagKey, 'true');

    try {
      // Exchange code for user info (done server-side for security)
      const user = await this.exchangeCodeForTokens(code);

      // Store user info (tokens are handled server-side)
      localStorage.setItem('google_user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    } finally {
      // Clear processing flag
      sessionStorage.removeItem(this.processingFlagKey);
    }
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    localStorage.removeItem('google_user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const userStr = localStorage.getItem('google_user');
    return !!userStr;
  }

  /**
   * Get current user from stored data
   */
  getCurrentUser(): GoogleUser | null {
    const userStr = localStorage.getItem('google_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
export type { GoogleUser };
