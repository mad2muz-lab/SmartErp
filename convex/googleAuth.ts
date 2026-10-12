import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Exchange Google OAuth authorization code for tokens (Server-side)
 * This must be done server-side to keep client_secret secure
 */
export const exchangeGoogleAuthCode = action({
  args: {
    code: v.string(),
    redirect_uri: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    user: v.optional(v.object({
      id: v.string(),
      email: v.string(),
      name: v.string(),
      given_name: v.string(),
      family_name: v.string(),
      picture: v.optional(v.string()),
      email_verified: v.boolean(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }

      console.log('🔍 Token exchange request:', {
        client_id: clientId,
        redirect_uri: args.redirect_uri,
        code_length: args.code.length,
        grant_type: 'authorization_code',
      });
      
      console.log('🚀 Starting token exchange...');

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: args.code,
          grant_type: 'authorization_code',
          redirect_uri: args.redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();
      console.log('✅ Token exchange successful, fetching user info...');

      // Get user info using access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userResponse.json();
      console.log('👤 User info retrieved successfully:', { email: userInfo.email, name: userInfo.name });

      return {
        success: true,
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          email_verified: userInfo.verified_email || false,
        },
      };

    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
