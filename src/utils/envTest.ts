// Environment variables validation - production mode
export const testEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_AUTH_REDIRECT_URI', 
    'VITE_APP_URL',
    'VITE_CONVEX_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
  } else {
    console.log('✅ All required environment variables are configured');
  }
  
  return {
    hasClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
    hasRedirectUri: !!import.meta.env.VITE_AUTH_REDIRECT_URI,
  };
};
