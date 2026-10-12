// Mobile Touch Utilities for better mobile experience
// Safe imports for web environment

// Prevent zoom on double tap
export const preventZoom = () => {
  let lastTouchEnd = 0;
  
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};

// Add touch feedback to elements
export const addTouchFeedback = (element: HTMLElement) => {
  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'transform 0.1s ease';
  });

  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)';
  });

  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)';
  });
};

// Detect if device is mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if device supports touch
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get viewport dimensions
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

// Check if element is in viewport
export const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const viewport = getViewportDimensions();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  );
};

// Smooth scroll to element
export const smoothScrollTo = (element: HTMLElement, offset = 0) => {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

// Debounce function for mobile performance
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for mobile performance
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Touch gesture detection and handling
export interface TouchGesture {
  type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

export class TouchGestureHandler {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private element: HTMLElement;
  private callbacks: Map<string, (gesture: TouchGesture) => void> = new Map();
  private longPressTimer: NodeJS.Timeout | null = null;
  private minSwipeDistance = 50;
  private maxTapDuration = 300;

  constructor(element: HTMLElement) {
    this.element = element;
    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.triggerCallback('long-press', {
        type: 'long-press',
        startX: this.touchStartX,
        startY: this.touchStartY,
        endX: this.touchStartX,
        endY: this.touchStartY,
        duration: Date.now() - this.touchStartTime
      });
    }, 1000); // 1 second for long press
  }

  private handleTouchMove(event: TouchEvent) {
    // Clear long press timer if user is moving
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const duration = Date.now() - this.touchStartTime;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    const gesture: TouchGesture = {
      type: 'tap',
      startX: this.touchStartX,
      startY: this.touchStartY,
      endX: touchEndX,
      endY: touchEndY,
      duration
    };

    // Determine gesture type
    if (absDeltaX > this.minSwipeDistance || absDeltaY > this.minSwipeDistance) {
      // It's a swipe
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        gesture.type = deltaX > 0 ? 'swipe-right' : 'swipe-left';
      } else {
        // Vertical swipe
        gesture.type = deltaY > 0 ? 'swipe-down' : 'swipe-up';
      }
    } else if (duration < this.maxTapDuration) {
      // It's a tap (short touch without significant movement)
      gesture.type = 'tap';
    }

    this.triggerCallback(gesture.type, gesture);
  }

  private triggerCallback(type: string, gesture: TouchGesture) {
    const callback = this.callbacks.get(type);
    if (callback) {
      callback(gesture);
    }
  }

  public on(gestureType: string, callback: (gesture: TouchGesture) => void) {
    this.callbacks.set(gestureType, callback);
  }

  public off(gestureType: string) {
    this.callbacks.delete(gestureType);
  }

  public destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));

    this.callbacks.clear();
  }
}

// Swipe navigation for mobile screens
export class SwipeNavigation {
  private gestureHandler: TouchGestureHandler;
  private currentIndex = 0;
  private routes: string[];
  private navigate: (path: string) => void;

  constructor(
    element: HTMLElement,
    routes: string[],
    navigate: (path: string) => void,
    initialRoute?: string
  ) {
    this.routes = routes;
    this.navigate = navigate;
    this.gestureHandler = new TouchGestureHandler(element);

    // Set initial index
    if (initialRoute) {
      this.currentIndex = routes.indexOf(initialRoute) || 0;
    }

    this.setupSwipeHandlers();
  }

  private setupSwipeHandlers() {
    this.gestureHandler.on('swipe-left', () => {
      this.navigateToNext();
    });

    this.gestureHandler.on('swipe-right', () => {
      this.navigateToPrevious();
    });
  }

  private navigateToNext() {
    if (this.currentIndex < this.routes.length - 1) {
      this.currentIndex++;
      this.navigate(this.routes[this.currentIndex]);
    }
  }

  private navigateToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.navigate(this.routes[this.currentIndex]);
    }
  }

  public setCurrentRoute(route: string) {
    const index = this.routes.indexOf(route);
    if (index !== -1) {
      this.currentIndex = index;
    }
  }

  public destroy() {
    this.gestureHandler.destroy();
  }
}

// Pull-to-refresh functionality
export class PullToRefresh {
  private element: HTMLElement;
  private onRefresh: () => Promise<void>;
  private isRefreshing = false;
  private startY = 0;
  private currentY = 0;
  private pullThreshold = 80;
  private refreshElement: HTMLElement | null = null;

  constructor(element: HTMLElement, onRefresh: () => Promise<void>) {
    this.element = element;
    this.onRefresh = onRefresh;
    this.createRefreshIndicator();
    this.bindEvents();
  }

  private createRefreshIndicator() {
    this.refreshElement = document.createElement('div');
    this.refreshElement.style.cssText = `
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f7fafc;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transform: translateY(-60px);
      transition: transform 0.3s ease;
      z-index: 1000;
    `;

    this.refreshElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #4a5568;">
        <div class="refresh-spinner" style="width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top: 2px solid #3182ce; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="font-size: 14px;">Pull to refresh</span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    this.element.style.position = 'relative';
    this.element.appendChild(this.refreshElement);
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent) {
    if (this.element.scrollTop === 0 && !this.isRefreshing) {
      this.startY = event.touches[0].clientY;
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (this.startY === 0 || this.isRefreshing) return;

    this.currentY = event.touches[0].clientY;
    const pullDistance = Math.max(0, this.currentY - this.startY);

    if (pullDistance > 0 && this.element.scrollTop === 0) {
      event.preventDefault();

      if (this.refreshElement) {
        const translateY = Math.min(pullDistance * 0.5, this.pullThreshold);
        this.refreshElement.style.transform = `translateY(${translateY - 60}px)`;

        // Update text based on pull distance
        const textElement = this.refreshElement.querySelector('span');
        if (textElement) {
          if (pullDistance >= this.pullThreshold) {
            textElement.textContent = 'Release to refresh';
            textElement.style.color = '#3182ce';
          } else {
            textElement.textContent = 'Pull to refresh';
            textElement.style.color = '#4a5568';
          }
        }
      }
    }
  }

  private async handleTouchEnd(event: TouchEvent) {
    if (this.startY === 0 || this.isRefreshing) {
      this.startY = 0;
      return;
    }

    const pullDistance = this.currentY - this.startY;

    if (pullDistance >= this.pullThreshold && this.element.scrollTop === 0) {
      await this.triggerRefresh();
    } else {
      this.resetPull();
    }

    this.startY = 0;
  }

  private async triggerRefresh() {
    this.isRefreshing = true;

    if (this.refreshElement) {
      this.refreshElement.style.transform = 'translateY(0px)';
      const textElement = this.refreshElement.querySelector('span');
      if (textElement) {
        textElement.textContent = 'Refreshing...';
      }
    }

    try {
      await this.onRefresh();
    } finally {
      this.isRefreshing = false;
      setTimeout(() => {
        this.resetPull();
      }, 500);
    }
  }

  private resetPull() {
    if (this.refreshElement) {
      this.refreshElement.style.transform = 'translateY(-60px)';
    }
  }

  public destroy() {
    if (this.refreshElement) {
      this.element.removeChild(this.refreshElement);
    }

    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  if (isMobileDevice()) {
    preventZoom();

    // Add touch feedback to buttons
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach((button) => {
        if (button instanceof HTMLElement) {
          addTouchFeedback(button);
        }
      });
    });
  }
};
