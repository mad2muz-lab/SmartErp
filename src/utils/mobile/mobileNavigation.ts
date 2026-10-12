import { Platform } from 'react-native';

// Mobile navigation types
export type NavigationDirection = 'left' | 'right' | 'up' | 'down';
export type NavigationType = 'push' | 'pop' | 'replace' | 'reset' | 'modal';

export interface NavigationGesture {
  direction: NavigationDirection;
  threshold: number;
  velocity: number;
  enabled: boolean;
}

export interface NavigationConfig {
  enableSwipeBack: boolean;
  enableSwipeForward: boolean;
  enablePullToRefresh: boolean;
  enableBottomSheet: boolean;
  enableHapticFeedback: boolean;
  animationDuration: number;
  gestureThreshold: number;
  velocityThreshold: number;
}

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  navigationStack: string[];
  modalStack: string[];
  isNavigating: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

class MobileNavigationService {
  private config: NavigationConfig = {
    enableSwipeBack: true,
    enableSwipeForward: false,
    enablePullToRefresh: true,
    enableBottomSheet: true,
    enableHapticFeedback: true,
    animationDuration: 300,
    gestureThreshold: 50,
    velocityThreshold: 500,
  };

  private state: NavigationState = {
    currentRoute: '',
    navigationStack: [],
    modalStack: [],
    isNavigating: false,
    canGoBack: false,
    canGoForward: false,
  };

  private listeners: Array<(state: NavigationState) => void> = [];

  // Initialize navigation service
  initialize(): void {
    console.log('🧭 Initializing mobile navigation service...');
    this.updateState();
    console.log('✅ Mobile navigation service initialized');
  }

  // Configure navigation
  configure(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Navigation configuration updated:', this.config);
  }

  // Get current configuration
  getConfig(): NavigationConfig {
    return { ...this.config };
  }

  // Get current state
  getState(): NavigationState {
    return { ...this.state };
  }

  // Navigate to route
  navigate(route: string, params?: any): void {
    try {
      console.log(`🧭 Navigating to: ${route}`);
      
      this.state.isNavigating = true;
      this.state.previousRoute = this.state.currentRoute;
      this.state.currentRoute = route;
      
      // Add to navigation stack
      if (this.state.previousRoute) {
        this.state.navigationStack.push(this.state.previousRoute);
      }
      
      this.updateState();
      
      // Trigger haptic feedback
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('light');
      }
      
      console.log(`✅ Navigation completed to: ${route}`);
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    } finally {
      this.state.isNavigating = false;
      this.updateState();
    }
  }

  // Go back
  goBack(): boolean {
    try {
      if (!this.state.canGoBack) {
        console.log('⚠️ Cannot go back - no previous route');
        return false;
      }

      console.log('🧭 Going back...');
      
      const previousRoute = this.state.navigationStack.pop();
      if (previousRoute) {
        this.state.previousRoute = this.state.currentRoute;
        this.state.currentRoute = previousRoute;
        
        this.updateState();
        
        // Trigger haptic feedback
        if (this.config.enableHapticFeedback) {
          this.triggerHapticFeedback('light');
        }
        
        console.log(`✅ Went back to: ${previousRoute}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Go back failed:', error);
      return false;
    }
  }

  // Go forward
  goForward(): boolean {
    try {
      if (!this.state.canGoForward) {
        console.log('⚠️ Cannot go forward - no next route');
        return false;
      }

      console.log('🧭 Going forward...');
      
      // Implementation for forward navigation
      // This would depend on your navigation library
      
      // Trigger haptic feedback
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('light');
      }
      
      console.log('✅ Went forward');
      return true;
    } catch (error) {
      console.error('❌ Go forward failed:', error);
      return false;
    }
  }

  // Reset navigation
  reset(routes: string[]): void {
    try {
      console.log('🧭 Resetting navigation...');
      
      this.state.navigationStack = [];
      this.state.modalStack = [];
      this.state.currentRoute = routes[0] || '';
      this.state.previousRoute = undefined;
      
      this.updateState();
      
      console.log('✅ Navigation reset completed');
    } catch (error) {
      console.error('❌ Navigation reset failed:', error);
    }
  }

  // Show modal
  showModal(route: string, params?: any): void {
    try {
      console.log(`🧭 Showing modal: ${route}`);
      
      this.state.modalStack.push(route);
      this.updateState();
      
      // Trigger haptic feedback
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('medium');
      }
      
      console.log(`✅ Modal shown: ${route}`);
    } catch (error) {
      console.error('❌ Show modal failed:', error);
    }
  }

  // Hide modal
  hideModal(): boolean {
    try {
      if (this.state.modalStack.length === 0) {
        console.log('⚠️ No modal to hide');
        return false;
      }

      console.log('🧭 Hiding modal...');
      
      this.state.modalStack.pop();
      this.updateState();
      
      // Trigger haptic feedback
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('light');
      }
      
      console.log('✅ Modal hidden');
      return true;
    } catch (error) {
      console.error('❌ Hide modal failed:', error);
      return false;
    }
  }

  // Handle swipe gesture
  handleSwipeGesture(direction: NavigationDirection, distance: number, velocity: number): boolean {
    try {
      console.log(`👆 Handling swipe gesture: ${direction}, distance: ${distance}, velocity: ${velocity}`);
      
      // Check if gesture meets thresholds
      const meetsDistanceThreshold = distance >= this.config.gestureThreshold;
      const meetsVelocityThreshold = Math.abs(velocity) >= this.config.velocityThreshold;
      
      if (!meetsDistanceThreshold && !meetsVelocityThreshold) {
        console.log('⚠️ Gesture thresholds not met');
        return false;
      }

      // Handle different swipe directions
      switch (direction) {
        case 'left':
          if (this.config.enableSwipeBack && this.state.canGoBack) {
            return this.goBack();
          }
          break;
          
        case 'right':
          if (this.config.enableSwipeForward && this.state.canGoForward) {
            return this.goForward();
          }
          break;
          
        case 'down':
          if (this.state.modalStack.length > 0) {
            return this.hideModal();
          }
          break;
          
        case 'up':
          // Could be used for pull-to-refresh or other actions
          break;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Handle swipe gesture failed:', error);
      return false;
    }
  }

  // Handle pull to refresh
  handlePullToRefresh(): boolean {
    try {
      if (!this.config.enablePullToRefresh) {
        console.log('⚠️ Pull to refresh is disabled');
        return false;
      }

      console.log('🔄 Handling pull to refresh...');
      
      // Trigger haptic feedback
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('medium');
      }
      
      // Emit refresh event
      this.emit('refresh', { route: this.state.currentRoute });
      
      console.log('✅ Pull to refresh handled');
      return true;
    } catch (error) {
      console.error('❌ Handle pull to refresh failed:', error);
      return false;
    }
  }

  // Check if swipe back is enabled
  isSwipeBackEnabled(): boolean {
    return this.config.enableSwipeBack && this.state.canGoBack;
  }

  // Check if swipe forward is enabled
  isSwipeForwardEnabled(): boolean {
    return this.config.enableSwipeForward && this.state.canGoForward;
  }

  // Check if pull to refresh is enabled
  isPullToRefreshEnabled(): boolean {
    return this.config.enablePullToRefresh;
  }

  // Check if bottom sheet is enabled
  isBottomSheetEnabled(): boolean {
    return this.config.enableBottomSheet;
  }

  // Get navigation stack
  getNavigationStack(): string[] {
    return [...this.state.navigationStack];
  }

  // Get modal stack
  getModalStack(): string[] {
    return [...this.state.modalStack];
  }

  // Add navigation listener
  addListener(callback: (state: NavigationState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove navigation listener
  removeListener(callback: (state: NavigationState) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Get platform-specific navigation behavior
  getPlatformBehavior(): Record<string, any> {
    if (Platform.OS === 'ios') {
      return {
        swipeBackEnabled: true,
        gestureEnabled: true,
        animationType: 'slide',
        presentationStyle: 'card',
      };
    } else {
      return {
        swipeBackEnabled: false,
        gestureEnabled: true,
        animationType: 'slide',
        presentationStyle: 'card',
      };
    }
  }

  // Get navigation history
  getNavigationHistory(): Array<{ route: string; timestamp: number }> {
    const history = [];
    
    // Add current route
    if (this.state.currentRoute) {
      history.push({
        route: this.state.currentRoute,
        timestamp: Date.now(),
      });
    }
    
    // Add navigation stack
    for (const route of this.state.navigationStack) {
      history.push({
        route,
        timestamp: Date.now() - (history.length * 1000), // Simulate timestamps
      });
    }
    
    return history;
  }

  // Clear navigation history
  clearHistory(): void {
    try {
      console.log('🧭 Clearing navigation history...');
      
      this.state.navigationStack = [];
      this.state.modalStack = [];
      this.state.previousRoute = undefined;
      
      this.updateState();
      
      console.log('✅ Navigation history cleared');
    } catch (error) {
      console.error('❌ Clear navigation history failed:', error);
    }
  }

  // Private methods

  private updateState(): void {
    // Update navigation capabilities
    this.state.canGoBack = this.state.navigationStack.length > 0;
    this.state.canGoForward = false; // Would be implemented based on navigation library
    
    // Notify listeners
    this.emit('stateChange', this.state);
  }

  private emit(event: string, data: any): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error('❌ Navigation listener error:', error);
      }
    }
  }

  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
    // In a real app, you'd use expo-haptics here
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle[type.toUpperCase()]);
    console.log(`📳 Haptic feedback: ${type}`);
  }
}

// Export singleton instance
export const mobileNavigation = new MobileNavigationService();

// Export types
export type { NavigationDirection, NavigationType, NavigationGesture, NavigationConfig, NavigationState };
