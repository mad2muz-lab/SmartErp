import React from 'react';
import WebResponsiveLayout from '../web/ResponsiveLayout';
import { isWeb } from '../../utils/shared/platform';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

// Mobile layout depends on react-native, so it must stay a dynamic import
// (never loaded in the browser). Defined once at module level so the component
// identity is stable across renders and navigation doesn't remount the page.
const MobileResponsiveLayout = React.lazy(() => import('../mobile/ResponsiveLayout'));

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  if (isWeb) {
    return <WebResponsiveLayout>{children}</WebResponsiveLayout>;
  }
  return (
    <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <MobileResponsiveLayout>{children}</MobileResponsiveLayout>
    </React.Suspense>
  );
};

// Export for backward compatibility
export default ResponsiveLayout;
