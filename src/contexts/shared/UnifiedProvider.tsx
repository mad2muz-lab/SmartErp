import React, { ReactNode } from 'react';
import { LanguageProvider } from './LanguageContext';
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
    <LanguageProvider>
      <AppStateProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AppStateProvider>
    </LanguageProvider>
  );
};

export default UnifiedProvider;
