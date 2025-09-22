import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { isWeb, getStorage } from '../../utils/shared/platform';

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
  handleGoogleAuth: (googleUser: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  selectedOrganization: string | null;
  setSelectedOrganization: (orgId: string) => void;
  organizationDetails: Organization | null;
  setNavigate: (navigateFn: (path: string, options?: any) => void) => void;
  clearAllAuthData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);

  // During HMR or initial render, context might be temporarily undefined
  // Return a loading state instead of throwing
  if (context === undefined) {
    console.warn('AuthContext not yet available, returning loading state');

    // Return a minimal loading context to prevent crashes
    return {
      user: null,
      loading: true,
      login: async () => {},
      loginWithGoogle: () => {},
      handleGoogleAuth: async () => {},
      logout: () => {},
      isAuthenticated: false,
      selectedOrganization: null,
      setSelectedOrganization: () => {},
      organizationDetails: null,
      setNavigate: () => {},
    } as AuthContextType;
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
  
  // Navigation function - will be set by the app when Router is available
  // Navigation function - will be set by the app when Router is available
  const navigateRef = React.useRef<((path: string, options?: any) => void) | null>(null);

  // Convex mutations
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
  
  // Debug logging for organization query
  React.useEffect(() => {
    console.log('🔍 Organization query debug:', {
      user: user ? { id: user.id, email: user.email } : null,
      userOrganizations: userOrganizations ? userOrganizations.length : 'loading',
      queryCalled: user?.id ? 'YES' : 'NO'
    });
  }, [user, userOrganizations]);

  // REMOVED: Problematic validation that was causing authentication loops
  // The validation logic was incorrectly flagging valid Convex IDs as invalid
  // and clearing localStorage, causing infinite authentication loops

  // Manual function to clear all auth data
  const clearAllAuthData = React.useCallback(() => {
    console.log('🔄 Manually clearing all authentication data');
    
    // Debug: Show what's currently stored
    if (isWeb) {
      const storedUser = localStorage.getItem('trading-erp-user');
      const storedOrg = localStorage.getItem('trading-erp-organization');
      console.log('🔍 Current localStorage data:', {
        user: storedUser ? JSON.parse(storedUser) : null,
        organization: storedOrg
      });
    }
    
    setUser(null);
    setSelectedOrganization(null);
    
    if (isWeb) {
      localStorage.removeItem('trading-erp-user');
      localStorage.removeItem('trading-erp-organization');
      localStorage.removeItem('manual-organization');
      sessionStorage.clear();
    }
    
    // Force page reload to start fresh
    window.location.href = '/login';
  }, [isWeb]);

  // Debug logging for organization context
  React.useEffect(() => {
    console.log('🔍 AuthContext Debug:', {
      user: user ? { 
        id: user.id, 
        idLength: user.id ? user.id.length : 'no id',
        email: user.email, 
        role: user.role 
      } : null,
      userOrganizations: userOrganizations ? userOrganizations.length : 'loading',
      selectedOrganization,
      organizationDetails: organizationDetails ? { name: organizationDetails.name, id: organizationDetails._id } : null
    });
  }, [user, userOrganizations, selectedOrganization, organizationDetails]);

  // Fix super admin primary organization if needed
  const fixSuperAdminPrimaryOrg = useMutation(api.globalUserManagement.fixSuperAdminPrimaryOrganization);
  
  // Platform-specific storage
  const storage = getStorage();

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
        if (isWeb) {
          localStorage.setItem('trading-erp-organization', orgToSelect.organization_id);
        } else {
          storage.setItem('trading-erp-organization', orgToSelect.organization_id);
        }
      }
    }
  }, [userOrganizations, selectedOrganization, user, storage]);

  // Fallback: If user has organizationId but no selectedOrganization, use it
  React.useEffect(() => {
    if (user?.organizationId && !selectedOrganization) {
      console.log('🏢 Using user organizationId as fallback:', user.organizationId);
      setSelectedOrganization(user.organizationId);
      if (isWeb) {
        localStorage.setItem('trading-erp-organization', user.organizationId);
      } else {
        storage.setItem('trading-erp-organization', user.organizationId);
      }
    }
  }, [user?.organizationId, selectedOrganization, storage]);

  // Check localStorage for stored organization
  React.useEffect(() => {
    if (isWeb && !selectedOrganization) {
      const storedOrg = localStorage.getItem('trading-erp-organization');
      if (storedOrg) {
        console.log('🏢 Loading organization from localStorage:', storedOrg);
        setSelectedOrganization(storedOrg);
      }
    }
  }, [selectedOrganization, isWeb]);

  // Last resort: Hardcoded organization for super admin if nothing else works
  React.useEffect(() => {
    if (user?.role === 'super_admin' && !selectedOrganization && user?.email === 'mad2muz@gmail.com') {
      const fallbackOrgId = 'k177v5nvxqq0xhx5wm5f7tqwpx7nwdek';
      console.log('🏢 Using hardcoded organization for super admin:', fallbackOrgId);
      setSelectedOrganization(fallbackOrgId);
      if (isWeb) {
        localStorage.setItem('trading-erp-organization', fallbackOrgId);
      }
    }
  }, [user?.role, user?.email, selectedOrganization, isWeb]);

  // Manual organization selection for debugging
  React.useEffect(() => {
    if (isWeb && !selectedOrganization) {
      // Check if there's a manual organization selection in localStorage
      const manualOrg = localStorage.getItem('manual-organization');
      if (manualOrg) {
        console.log('🏢 Using manual organization selection:', manualOrg);
        setSelectedOrganization(manualOrg);
      }
    }
  }, [selectedOrganization, isWeb]);

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
              if (isWeb) {
                window.location.reload();
              }
            }
          })
          .catch(error => {
            console.error('❌ Failed to fix super admin primary organization:', error);
          });
      }
    }
  }, [user, userOrganizations, fixSuperAdminPrimaryOrg]);

  // Platform-specific Google Auth service
  const getGoogleAuthService = async () => {
    if (isWeb) {
      const { googleAuthService } = await import('../../utils/googleAuth');
      return googleAuthService;
    } else {
      // Mobile Google Auth service (we'll implement this later)
      const { mobileGoogleAuthService } = await import('../../utils/mobile/googleAuth');
      return mobileGoogleAuthService;
    }
  };

  // Initialize authentication state - simplified for fast loading
  useEffect(() => {
    const initAuth = async () => {
      // Prevent infinite loops - only run if we don't have a user yet
      if (user) {
        setLoading(false);
        return;
      }
      
      // Simple timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⏰ Auth initialization timeout - setting loading to false');
        setLoading(false);
      }, 1000); // Reduced timeout for faster user experience
      
      try {
        const googleAuthService = await getGoogleAuthService();
        
        // Check if user is already processed and stored
        let storedUser = null;
        if (isWeb) {
          storedUser = localStorage.getItem('trading-erp-user');
        } else {
          storedUser = await storage.getItem('trading-erp-user');
        }
        
        if (storedUser) {
          try {
            const appUser = JSON.parse(storedUser);
            
            // REMOVED: Problematic validation that was causing authentication loops
            // The validation logic was incorrectly flagging valid Convex IDs as invalid
            
            // Simplified authentication - use stored user data for faster loading
            if (googleAuthService.isAuthenticated()) {
              const googleUser = googleAuthService.getCurrentUser();
              if (googleUser && googleUser.email === appUser.email) {
                // Use stored user data directly for faster loading
                console.log('🔄 Using stored user data for fast authentication:', appUser.email, 'with ID:', appUser.id);
                setUser(appUser);
                
                if (isWeb) {
                  localStorage.setItem('trading-erp-user', JSON.stringify(appUser));
                } else {
                  await storage.setItem('trading-erp-user', JSON.stringify(appUser));
                }
                
                return;
              } else {
                console.log('🔄 Google user email mismatch, clearing stored data');
                if (isWeb) {
                  localStorage.removeItem('trading-erp-user');
                } else {
                  await storage.removeItem('trading-erp-user');
                }
              }
            } else {
              console.log('🔄 Google user not authenticated, clearing stored data');
              if (isWeb) {
                localStorage.removeItem('trading-erp-user');
              } else {
                await storage.removeItem('trading-erp-user');
              }
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
            if (isWeb) {
              localStorage.removeItem('trading-erp-user');
            } else {
              await storage.removeItem('trading-erp-user');
            }
          }
        }

        // Simplified authentication - skip complex backend verification for faster loading
        if (googleAuthService.isAuthenticated()) {
          const googleUser = googleAuthService.getCurrentUser();
          if (googleUser) {
            console.log('🔄 Google user authenticated, skipping complex verification for fast loading:', googleUser.email);
            // Skip complex backend verification to improve loading speed
            // Backend verification will happen when user performs actions
          }
        }

        // No authentication found
        console.log('🔒 No Google authentication found, user must login');
        // Clear any legacy data
        if (isWeb) {
          localStorage.removeItem('trading-erp-user');
          localStorage.removeItem('trading-erp-organization');
        } else {
          await storage.removeItem('trading-erp-user');
          await storage.removeItem('trading-erp-organization');
        }
        
        // Load saved organization from storage
        let savedOrg = null;
        if (isWeb) {
          savedOrg = localStorage.getItem('trading-erp-organization');
        } else {
          savedOrg = await storage.getItem('trading-erp-organization');
        }
        
        if (savedOrg) {
          console.log('🔄 Loading saved organization from storage:', savedOrg);
          setSelectedOrganization(savedOrg);
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Clear global auth flag
        sessionStorage.removeItem(globalAuthFlag.current);
        clearTimeout(timeoutId);
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

  const loginWithGoogle = async () => {
    const googleAuthService = await getGoogleAuthService();
    googleAuthService.login();
  };

  // Global flag to prevent multiple simultaneous auth calls
  const globalAuthFlag = useRef('global-auth-processing');

  const handleGoogleAuth = async (googleUser: any) => {
    // Check global flag first
    const isProcessing = sessionStorage.getItem(globalAuthFlag.current);
    if (isProcessing) {
      console.log('🛑 Another authentication is already in progress, skipping...');
      return;
    }

    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('🛑 handleGoogleAuth already in progress, skipping duplicate call');
      return;
    }

    // Set global flag
    sessionStorage.setItem(globalAuthFlag.current, 'true');
    setLoading(true);
    try {
      console.log('🔍 Starting Google auth for:', googleUser.email);
      
      // Check if Convex URL is properly configured
      const convexUrl = import.meta.env.VITE_CONVEX_URL;
      if (!convexUrl) {
        throw new Error('Convex URL not configured. Please check environment variables.');
      }
      
      console.log('🔍 Convex URL configured:', convexUrl);
      
      // CRITICAL SECURITY FIX: Clear ALL cached data before authentication
      setUser(null);
      
      if (isWeb) {
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
      } else {
        await storage.removeItem('trading-erp-user');
        await storage.removeItem('trading-erp-organization');
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
        
        if (isWeb) {
          const navFn = navigateRef.current;
          if (navFn) {
            navFn('/pending-approval', { 
              state: {
                message: result.message,
                email: googleUser.email,
                name: googleUser.name,
                status: result.status
              }
            });
          }
        }
        return;
      }

      // User is approved, proceed with login
      const dbUser = result as any;
      console.log('🔄 User is approved, setting user state:', dbUser.email);
      console.log('🔍 Backend user object:', dbUser);
      console.log('🔍 User _id field:', dbUser._id);
      
      const appUser: User = {
        id: dbUser._id,
        email: dbUser.email,
        firstName: dbUser.given_name || '',
        lastName: dbUser.family_name || '',
        role: dbUser.role || 'user',
        organizationId: dbUser.organization_id || '',
        permissions: dbUser.permissions || ['read'],
      };
      
      console.log('🔍 Frontend user object:', appUser);
      console.log('🔍 User ID for organization query:', appUser.id);
      console.log('🔍 User ID validation - Length:', appUser.id.length, 'Contains @:', appUser.id.includes('@'));

      setUser(appUser);
      
      if (isWeb) {
        localStorage.setItem('trading-erp-user', JSON.stringify(appUser));
        console.log('🔍 Stored user in localStorage with ID:', appUser.id);
      } else {
        await storage.setItem('trading-erp-user', JSON.stringify(appUser));
      }

      // Auto-assign to organization if not set
      if (!dbUser.organization_id && selectedOrganization) {
        await updateUserOrganization({
          user_id: dbUser._id,
          organization_id: selectedOrganization as any,
        });
        appUser.organizationId = selectedOrganization;
        setUser(appUser);
      }

      // Clear global auth flag on success
      sessionStorage.removeItem(globalAuthFlag.current);

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
      console.log('🔄 Auth failed, user can try again');
    } finally {
      // Clear global auth flag
      sessionStorage.removeItem(globalAuthFlag.current);
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setSelectedOrganization(null);
    
    if (isWeb) {
      localStorage.removeItem('trading-erp-user');
      localStorage.removeItem('trading-erp-organization');
    } else {
      await storage.removeItem('trading-erp-user');
      await storage.removeItem('trading-erp-organization');
    }
    
    const googleAuthService = await getGoogleAuthService();
    googleAuthService.logout();
    
    if (isWeb) {
      const navFn = navigateRef.current;
      if (navFn) {
        navFn('/login');
      }
    }
  };

  const handleSetSelectedOrganization = async (orgId: string) => {
    console.log('🔄 AuthContext: Setting selected organization to:', orgId);
    setSelectedOrganization(orgId);
    
    if (isWeb) {
      localStorage.setItem('trading-erp-organization', orgId);
    } else {
      await storage.setItem('trading-erp-organization', orgId);
    }
  };

  // Safe setNavigate function that doesn't cause setState during render
  const safeSetNavigate = React.useCallback((navigateFn: (path: string, options?: any) => void) => {
    navigateRef.current = navigateFn;
  }, []);

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
    setNavigate: safeSetNavigate,
    clearAllAuthData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
