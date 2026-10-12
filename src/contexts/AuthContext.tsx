import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { googleAuthService, GoogleUser } from '../utils/googleAuth';
import { sanitizeUserState } from '../utils/clearCache';
import { LOCAL_CONVEX_URL } from '../utils/convexUrl';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
}

interface Organization {
  _id: string;
  name: string;
  currency: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  handleGoogleAuth: (googleUser: GoogleUser) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  selectedOrganization: string | null;
  setSelectedOrganization: (orgId: string) => void;
  organizationDetails: Organization | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const navigate = useNavigate();

  // Convex mutations for Google OAuth
  const createOrUpdateGoogleUser = useMutation(api.auth.createOrUpdateGoogleUser);
  const updateUserOrganization = useMutation(api.auth.updateUserOrganization);

  // Fetch organization details
  const organizationDetails = useQuery(
    api.organizations.getOrganization,
    selectedOrganization ? { id: selectedOrganization as any } : 'skip'
  );

  // Get user's organization assignments
  const userOrganizations = useQuery(
    api.globalUserManagement.getUserOrganizationAssignments,
    user?.id ? { user_id: user.id as any } : 'skip'
  );

  // Fix super admin primary organization if needed
  const fixSuperAdminPrimaryOrg = useMutation(api.globalUserManagement.fixSuperAdminPrimaryOrganization);
  
  // Auto-select user's primary organization or first available organization
  React.useEffect(() => {
    if (userOrganizations && userOrganizations.length > 0 && !selectedOrganization) {
      // Find primary organization first
      const primaryOrg = userOrganizations.find(org => org.is_primary);
      const firstOrg = userOrganizations[0];
      
      const orgToSelect = primaryOrg || firstOrg;
      
      if (orgToSelect) {
        console.log('🏢 Auto-selecting organization:', orgToSelect.organization_name);
        setSelectedOrganization(orgToSelect.organization_id);
        localStorage.setItem('trading-erp-organization', orgToSelect.organization_id);
      }
    }
  }, [userOrganizations, selectedOrganization, user]);

  // Auto-fix super admin primary organization if missing
  React.useEffect(() => {
    if (user && user.role === 'super_admin' && userOrganizations && userOrganizations.length > 0) {
      const hasPrimaryOrg = userOrganizations.some(org => org.is_primary);
      if (!hasPrimaryOrg) {
        console.log('🔧 Auto-fixing super admin primary organization for:', user.email);
        fixSuperAdminPrimaryOrg({ user_id: user.id as any })
          .then(result => {
            if (result.success) {
              console.log('✅ Fixed super admin primary organization:', result.message);
              // Refresh the page to get updated organization assignments
              window.location.reload();
            }
          })
          .catch(error => {
            console.error('❌ Failed to fix super admin primary organization:', error);
          });
      }
    }
  }, [user, userOrganizations, fixSuperAdminPrimaryOrg]);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      // Prevent infinite loops - only run if we don't have a user yet
      if (user) {
        setLoading(false);
        return;
      }
      try {
        // Check if user is already processed and stored
        const storedUser = localStorage.getItem('trading-erp-user');
        if (storedUser) {
          try {
            const appUser = JSON.parse(storedUser);
            
            // CRITICAL FIX: Always verify user status with backend for pending users
            // This ensures we get the latest status from the database
            if (googleAuthService.isAuthenticated()) {
              const googleUser = googleAuthService.getCurrentUser();
              if (googleUser && googleUser.email === appUser.email) {
                // Always verify with backend to get latest status
                try {
                  const result = await createOrUpdateGoogleUser({
                    google_id: googleUser.id,
                    email: googleUser.email,
                    name: googleUser.name,
                    given_name: googleUser.given_name,
                    family_name: googleUser.family_name,
                    picture: googleUser.picture,
                    email_verified: googleUser.email_verified,
                  });

                  console.log('🔍 Backend verification result:', result);

                  // Check if user requires approval
                  if ('requires_approval' in result && result.requires_approval) {
                    // DO NOT set user state for pending users - they should not be considered authenticated
                    console.log('🔄 User requires approval, NOT setting user state:', googleUser.email);
                    navigate('/pending-approval', { 
                      state: { 
                        message: result.message,
                        email: googleUser.email,
                        name: googleUser.name,
                        status: result.status
                      }
                    });
                    return;
                  }

                  // User is approved, update stored user with latest data
                  const dbUser = result as any;
                  const updatedAppUser: User = {
                    id: dbUser._id,
                    email: dbUser.email,
                    firstName: dbUser.given_name || '',
                    lastName: dbUser.family_name || '',
                    role: dbUser.role || 'user',
                    organizationId: dbUser.organization_id || '',
                    permissions: dbUser.permissions || ['read'],
                  };
                  setUser(updatedAppUser);
                  localStorage.setItem('trading-erp-user', JSON.stringify(updatedAppUser));
                  console.log('🔄 Verified and updated user from localStorage:', updatedAppUser.email);
                  return;
                } catch (error) {
                  console.error('Error verifying user status:', error);
                  // If verification fails, clear stored user and let user re-authenticate
                  localStorage.removeItem('trading-erp-user');
                  console.log('🔄 Cleared corrupted user data, user needs to re-authenticate');
                  return;
                }
              }
            }
            
            // If no Google auth or email mismatch, clear stored user
            localStorage.removeItem('trading-erp-user');
            console.log('🔄 No Google auth or email mismatch, cleared stored user');
            return;
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('trading-erp-user');
          }
        }

        // Check if user is authenticated with Google (raw Google data)
        if (googleAuthService.isAuthenticated()) {
          const googleUser = googleAuthService.getCurrentUser();
          if (googleUser) {
            // CRITICAL FIX: Always verify user status with backend
            try {
              const result = await createOrUpdateGoogleUser({
                google_id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                given_name: googleUser.given_name,
                family_name: googleUser.family_name,
                picture: googleUser.picture,
                email_verified: googleUser.email_verified,
              });

              // Check if user requires approval
              if ('requires_approval' in result && result.requires_approval) {
                // DO NOT set user state for pending users - they should not be considered authenticated
                console.log('🔄 User requires approval, NOT setting user state in initAuth:', googleUser.email);
                navigate('/pending-approval', { 
                  state: { 
                    message: result.message,
                    email: googleUser.email,
                    name: googleUser.name,
                    status: result.status
                  }
                });
                return;
              }

              // User is approved, proceed with login
              const dbUser = result as any;
              const appUser: User = {
                id: dbUser._id,
                email: dbUser.email,
                firstName: dbUser.given_name || '',
                lastName: dbUser.family_name || '',
                role: dbUser.role || 'user',
                organizationId: dbUser.organization_id || '',
                permissions: dbUser.permissions || ['read'],
              };
              setUser(appUser);
              localStorage.setItem('trading-erp-user', JSON.stringify(appUser));
              console.log('🔄 Authenticated user with backend verification:', appUser.email);
            } catch (error) {
              console.error('Error during Google auth verification:', error);
              // Don't set user if verification fails
            }
          }
        } else {
          // No authentication found
          console.log('🔒 No Google authentication found, user must login');
          // Clear any legacy data
          localStorage.removeItem('trading-erp-user');
          localStorage.removeItem('trading-erp-organization');
        }
        
        // Load saved organization from localStorage
        const savedOrg = localStorage.getItem('trading-erp-organization');
        if (savedOrg) {
          console.log('🔄 Loading saved organization from localStorage:', savedOrg);
          setSelectedOrganization(savedOrg);
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Email/password authentication disabled for security - Google OAuth only
    throw new Error('Email/password authentication is disabled. Please use Google OAuth for secure authentication.');
    
    setLoading(false);
  };

  const loginWithGoogle = () => {
    googleAuthService.login();
  };

  const handleGoogleAuth = async (googleUser: GoogleUser) => {
    setLoading(true);
    try {
      console.log('🔍 Starting Google auth for:', googleUser.email);
      
      console.log('🔍 Local Convex URL configured:', LOCAL_CONVEX_URL);
      
      // CRITICAL SECURITY FIX: Clear ALL cached data before authentication
      setUser(null);
      localStorage.removeItem('trading-erp-user');
      localStorage.removeItem('trading-erp-organization');
      sessionStorage.clear(); // Clear session storage too
      
      // Force browser cache refresh for security
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (e) {
          console.log('Cache clearing failed:', e);
        }
      }
      
      // Create or update user in Convex database
      const result = await createOrUpdateGoogleUser({
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        given_name: googleUser.given_name,
        family_name: googleUser.family_name,
        picture: googleUser.picture,
        email_verified: googleUser.email_verified,
      });

      console.log('🔍 Backend result:', result);

      // Check if user requires approval
      if ('requires_approval' in result && result.requires_approval) {
        // DO NOT set user state for pending users - they should not be considered authenticated
        console.log('🔄 User requires approval, NOT setting user state in handleGoogleAuth:', googleUser.email);
        console.log('🔄 Navigating to pending approval with status:', result.status);
        // Sanitize the state before navigation to prevent information disclosure
        const sanitizedState = sanitizeUserState({
          message: result.message,
          email: googleUser.email,
          name: googleUser.name,
          status: result.status
        });
        
        navigate('/pending-approval', { 
          state: sanitizedState
        });
        return;
      }

      // User is approved, proceed with login
      const dbUser = result as any;
      console.log('🔄 User is approved, setting user state:', dbUser.email);
      
      const appUser: User = {
        id: dbUser._id,
        email: dbUser.email,
        firstName: dbUser.given_name || '',
        lastName: dbUser.family_name || '',
        role: dbUser.role || 'user', // Use role from database, fallback to 'user'
        organizationId: dbUser.organization_id || '',
        permissions: dbUser.permissions || ['read'],
      };

      setUser(appUser);
      localStorage.setItem('trading-erp-user', JSON.stringify(appUser));

      // Auto-assign to organization if not set
      if (!dbUser.organization_id && selectedOrganization) {
        await updateUserOrganization({
          user_id: dbUser._id,
          organization_id: selectedOrganization as any,
        });
        appUser.organizationId = selectedOrganization;
        setUser(appUser);
      }

    } catch (error) {
      console.error('❌ Google auth error:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('Convex URL not configured')) {
          console.error('❌ Environment configuration error');
        } else if (error.message.includes('Network')) {
          console.error('❌ Network error - check internet connection');
        }
      }
      
      // Don't throw error, just log it and let the user try again
      // This prevents redirect loops
      console.log('🔄 Auth failed, user can try again');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedOrganization(null);
    localStorage.removeItem('trading-erp-user');
    localStorage.removeItem('trading-erp-organization');
    googleAuthService.logout();
    navigate('/login');
  };

  const handleSetSelectedOrganization = (orgId: string) => {
    console.log('🔄 AuthContext: Setting selected organization to:', orgId);
    setSelectedOrganization(orgId);
    localStorage.setItem('trading-erp-organization', orgId);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    handleGoogleAuth,
    logout,
    isAuthenticated: !!user, // Only approved users are considered authenticated
    selectedOrganization,
    setSelectedOrganization: handleSetSelectedOrganization,
    organizationDetails: organizationDetails || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
