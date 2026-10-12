import React from 'react';
import { ChakraProvider, Box, Spinner, Center, VStack, Text } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate, UNSAFE_future, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { LOCAL_CONVEX_URL } from './utils/convexUrl';
import { Toaster } from 'react-hot-toast';

import './utils/mobileStyles.css';
import { isWeb } from './utils/shared/platform'; // New import

// Lazy load screens for better mobile performance with preloading
import { lazy, Suspense } from 'react';

// Removed heavy preloading to improve startup performance

const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const VendorOnboardingScreen = lazy(() => import('./screens/VendorOnboardingScreen'));
const AuthCallbackScreen = lazy(() => import('./screens/AuthCallbackScreen'));
const PendingApprovalScreen = lazy(() => import('./screens/PendingApprovalScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const CustomerListScreen = lazy(() => import('./screens/CustomerListScreen'));
const LeadListScreen = lazy(() => import('./screens/LeadListScreen'));
const InventoryListScreen = lazy(() => import('./screens/InventoryListScreen'));
const InventoryMovementsScreen = lazy(() => import('./screens/InventoryMovementsScreen'));
const SuppliersScreen = lazy(() => import('./screens/SuppliersScreen'));
const QuotationListScreen = lazy(() => import('./screens/QuotationListScreen'));
const DeliveryNoteListScreen = lazy(() => import('./screens/DeliveryNoteListScreen'));
const InvoiceListScreen = lazy(() => import('./screens/InvoiceListScreen'));
const InvoiceManagementScreen = lazy(() => import('./screens/InvoiceManagementScreen'));
const VendorPosScreen = lazy(() => import('./screens/VendorPosScreen'));
const VendorProductsScreen = lazy(() => import('./screens/VendorProductsScreen'));
const VendorManagementScreen = lazy(() => import('./screens/VendorManagementScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const AdminUserManagementScreen = lazy(() => import('./screens/AdminUserManagementScreen'));
const GlobalAdminScreen = lazy(() => import('./screens/GlobalAdminScreen'));
const IntelligentProcessFlowScreen = lazy(() => import('./screens/IntelligentProcessFlowScreen'));
const ProcurementDashboardScreen = lazy(() => import('./screens/ProcurementDashboardScreen'));
const ProcurementAnalyticsScreen = lazy(() => import('./screens/ProcurementAnalyticsScreen'));
const PurchaseRequisitionListScreen = lazy(() => import('./components/procurement/PurchaseRequisitionTable'));
const PurchaseOrderListScreen = lazy(() => import('./components/procurement/PurchaseOrderTable'));
const MaterialReceiptListScreen = lazy(() => import('./components/procurement/MaterialReceiptTable'));
const PendingApprovalsScreen = lazy(() => import('./screens/PendingApprovalsScreen'));
const ProfitSharingDashboardScreen = lazy(() => import('./screens/ProfitSharingDashboardScreen').then(m => ({ default: m.ProfitSharingDashboardScreen })));
const PartnersManagementScreen = lazy(() => import('./screens/PartnersManagementScreen').then(m => ({ default: m.PartnersManagementScreen })));
const CompanyExpensesScreen = lazy(() => import('./screens/CompanyExpensesScreen').then(m => ({ default: m.CompanyExpensesScreen })));
const AccountingScreen = lazy(() => import('./screens/AccountingScreen'));
const CorporateGovernanceScreen = lazy(() => import('./screens/CorporateGovernanceScreen'));
const HRManagementScreen = lazy(() => import('./screens/HRManagementScreen'));
const InternationalHiringDemoScreen = lazy(() => import('./screens/InternationalHiringDemoScreen'));
const AssetManagementScreen = lazy(() => import('./screens/AssetManagementScreen'));


// Import shared layout
import ResponsiveLayout from './components/shared/ResponsiveLayout';
import { UnifiedProvider } from './contexts/shared/UnifiedProvider';
import { useAuth } from './contexts/shared/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PermissionGuard from './components/PermissionGuard';
import MobileInstallPrompt from './components/MobileInstallPrompt';

// Wrapper components for Procurement modules
const PurchaseRequisitionWrapper = () => {
  const { selectedOrganization } = useAuth();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  
  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view purchase requisitions.</Text>
      </Box>
    );
  }
  
  return <PurchaseRequisitionListScreen organizationId={selectedOrganization} autoOpenCreate={action === 'create'} />;
};

const PurchaseOrderWrapper = () => {
  const { selectedOrganization } = useAuth();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  
  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view purchase orders.</Text>
      </Box>
    );
  }
  
  return <PurchaseOrderListScreen organizationId={selectedOrganization} autoOpenCreate={action === 'create'} />;
};

const MaterialReceiptWrapper = () => {
  const { selectedOrganization } = useAuth();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  
  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view material receipts.</Text>
      </Box>
    );
  }
  
  return <MaterialReceiptListScreen organizationId={selectedOrganization} autoOpenCreate={action === 'create'} />;
};

const convex = new ConvexReactClient(LOCAL_CONVEX_URL);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, activeVendor } = useAuth();
  const hasVendorSession = Boolean(
    activeVendor ||
    localStorage.getItem('trading_erp_active_vendor_session') ||
    localStorage.getItem('trading-erp-user')
  );

  if (loading && !hasVendorSession) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!user && !hasVendorSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Global Admin Route Component
const GlobalAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Web App Content Component
const WebAppContent: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { setNavigate, loading } = authContext;

  // Set the navigation function when Router is available and AuthProvider is ready
  React.useEffect(() => {
    if (!loading && setNavigate) {
      setNavigate(navigate);
    }
  }, [navigate, setNavigate, loading]);

  // Removed heavy preloading to improve startup performance

  // Show loading while AuthProvider is initializing
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Loading component for lazy-loaded screens - optimized for speed
  const LoadingSpinner = () => (
    <Center h="200px">
      <VStack spacing={3}>
        <Spinner size="lg" color="blue.500" thickness="3px" speed="0.8s" />
        <Text fontSize="sm" color="gray.600" fontWeight="medium">Loading...</Text>
      </VStack>
    </Center>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/vendor-onboarding" element={<VendorOnboardingScreen />} />
          <Route path="/auth/callback" element={<AuthCallbackScreen />} />
          <Route path="/pending-approval" element={<PendingApprovalScreen />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ResponsiveLayout>
                  <DashboardScreen />
                </ResponsiveLayout>
              </ProtectedRoute>
            }
          />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="customers" requiredAction="read">
                <ResponsiveLayout>
                  <CustomerListScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="leads" requiredAction="read">
                <ResponsiveLayout>
                  <LeadListScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="inventory" requiredAction="read">
                <ResponsiveLayout>
                  <InventoryListScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/movements"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="inventory" requiredAction="update">
                <ResponsiveLayout>
                  <InventoryMovementsScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="suppliers" requiredAction="read">
                <ResponsiveLayout>
                  <SuppliersScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="quotations" requiredAction="read">
                <ResponsiveLayout>
                  <QuotationListScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-notes"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="delivery_notes" requiredAction="read">
                <ResponsiveLayout>
                  <DeliveryNoteListScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="invoices" requiredAction="read">
                <ResponsiveLayout>
                  <InvoiceManagementScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <VendorPosScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/products"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <VendorProductsScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor-pos"
          element={<Navigate to="/pos" replace />}
        />
        <Route
          path="/invoices/dashboard"
          element={<Navigate to="/invoices" replace />}
        />
        <Route
          path="/invoices/management"
          element={<Navigate to="/invoices" replace />}
        />
        <Route
          path="/accounting"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <AccountingScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <CorporateGovernanceScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ProfileScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <SettingsScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <AdminUserManagementScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <VendorManagementScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={<Navigate to="/admin/vendors" replace />}
        />
        <Route
          path="/admin/global"
          element={
            <GlobalAdminRoute>
              <ResponsiveLayout>
                <GlobalAdminScreen />
              </ResponsiveLayout>
            </GlobalAdminRoute>
          }
        />
        <Route
          path="/intelligent-process-flow"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <IntelligentProcessFlowScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ProcurementDashboardScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/analytics"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ProcurementAnalyticsScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/requisitions"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <PurchaseRequisitionWrapper />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/orders"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <PurchaseOrderWrapper />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/receipts"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <MaterialReceiptWrapper />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/pending-approvals"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <PendingApprovalsScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit-sharing"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="profit_sharing" requiredAction="read">
                <ResponsiveLayout>
                  <ProfitSharingDashboardScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit-sharing/partners"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="profit_sharing" requiredAction="read">
                <ResponsiveLayout>
                  <PartnersManagementScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit-sharing/expenses"
          element={
            <ProtectedRoute>
              <PermissionGuard requiredModel="profit_sharing" requiredAction="read">
                <ResponsiveLayout>
                  <CompanyExpensesScreen />
                </ResponsiveLayout>
              </PermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <HRManagementScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/mobilization-demo"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <InternationalHiringDemoScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <AssetManagementScreen />
              </ResponsiveLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toaster position="top-right" />
      <MobileInstallPrompt />
    </Box>
  );
};

// Web App Component (existing functionality)
const WebApp: React.FC = () => {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <WebAppContent />
    </Router>
  );
};

// Mobile App Component (new functionality)
const MobileApp: React.FC = () => {
  return (
    <ResponsiveLayout>
      {/* Mobile navigation is handled by ResponsiveLayout */}
    </ResponsiveLayout>
  );
};

// Main App Component with platform detection
function App() {
  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <ChakraProvider>
          <UnifiedProvider>
            {isWeb ? <WebApp /> : <MobileApp />}
          </UnifiedProvider>
        </ChakraProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}

export default App;
