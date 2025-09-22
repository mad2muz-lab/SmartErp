import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppStateProvider } from './AppStateContext';

interface UnifiedProviderProps {
  children: ReactNode;
}

/**
 * Unified Provider that combines all shared contexts
 * This ensures consistent state management across all platforms
 */
export const UnifiedProvider: React.FC<UnifiedProviderProps> = ({ children }) => {
  return (
    <AppStateProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AppStateProvider>
  );
};

export default UnifiedProvider;
