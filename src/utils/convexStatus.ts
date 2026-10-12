import { LOCAL_CONVEX_URL } from './convexUrl';

// Convex connection status utility
export const checkConvexConnection = async () => {
  try {
    // Test basic connectivity to Convex (using a simple query instead of health endpoint)
    try {
      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      const client = new ConvexHttpClient(LOCAL_CONVEX_URL);
      
      // Try a simple query to test connectivity
      await client.query(api.globalUserManagement.listGlobalAdmins);
      
      return {
        status: 'success',
        message: 'Convex connection successful',
        details: `Connected to ${LOCAL_CONVEX_URL}`
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Convex connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Convex connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const logConvexStatus = async () => {
  const status = await checkConvexConnection();
  console.log('🔍 Convex Connection Status:', status);
  return status;
};
