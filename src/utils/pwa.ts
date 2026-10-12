// PWA Service Worker Registration - optimized for speed
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Use requestIdleCallback for non-blocking registration
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          await registerServiceWorkerInternal();
        }, { timeout: 5000 });
      } else {
        // Fallback for older browsers
        setTimeout(registerServiceWorkerInternal, 100);
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
};

const registerServiceWorkerInternal = async () => {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always fetch latest SW
    });

    console.log('✅ Service Worker registered successfully');

    // Handle updates efficiently
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New version available');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
};

// Check if app is installed as PWA
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Install PWA prompt
export const showInstallPrompt = () => {
  const deferredPrompt = (window as any).deferredPrompt;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA installed');
      }
      (window as any).deferredPrompt = null;
    });
  }
};

// PWA Audit and Performance Monitoring
export const runPwaAudit = () => {
  const audit = {
    installable: false,
    serviceWorker: false,
    manifest: false,
    https: false,
    viewport: false,
    themeColor: false,
    appleTouchIcon: false,
    performance: {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    }
  };

  // Check if PWA is installable
  audit.installable = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true;

  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      audit.serviceWorker = registrations.length > 0;
    });
  }

  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  audit.manifest = !!manifestLink;

  // Check HTTPS
  audit.https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  audit.viewport = !!viewportMeta;

  // Check theme color
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  audit.themeColor = !!themeColorMeta;

  // Check Apple touch icon
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  audit.appleTouchIcon = !!appleTouchIcon;

  console.log('🔍 PWA Audit Results:', audit);
  return audit;
};

// Performance monitoring - deferred to avoid blocking startup
export const initPerformanceMonitoring = () => {
  // Defer performance monitoring to avoid blocking app startup
  setTimeout(() => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('📊 Page Load Performance:', {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          totalTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart)
        });
      }
    } catch (error) {
      // Silently fail to avoid blocking app
    }
  }, 2000); // Defer by 2 seconds
};

// Mobile-specific performance optimizations - deferred
export const optimizeForMobile = () => {
  // Defer mobile optimizations to avoid blocking app startup
  setTimeout(() => {
    try {
      if ('ontouchstart' in window) {
        document.documentElement.classList.add('touch-device');
        console.log('👆 Touch device optimizations applied');
      }

      const isLowEndDevice = navigator.hardwareConcurrency <= 2;
      if (isLowEndDevice) {
        console.log('📱 Low-end device detected');
      }
    } catch (error) {
      // Silently fail to avoid blocking app
    }
  }, 1000); // Defer by 1 second
};



// Mobile optimizations - deferred to avoid blocking startup
export const simpleMobileOptimizations = {
  // Optimize images for mobile - deferred
  optimizeImages: () => {
    setTimeout(() => {
      try {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          // Add lazy loading
          if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
          }

          // Optimize large images
          if (img.naturalWidth > 1000) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
          }
        });
      } catch (error) {
        // Silently fail to avoid blocking app
      }
    }, 3000); // Defer by 3 seconds
  },

  // Optimize for slow connections - deferred
  slowConnectionMode: () => {
    setTimeout(() => {
      try {
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          const isSlow = ['slow-2g', '2g', '3g'].includes(connection.effectiveType);

          if (isSlow) {
            // Disable non-essential features
            document.documentElement.classList.add('slow-connection');

            // Reduce animation complexity
            const style = document.createElement('style');
            style.textContent = `
              * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
              }
              .non-essential {
                display: none !important;
              }
            `;
            document.head.appendChild(style);
          }
        }
      } catch (error) {
        // Silently fail to avoid blocking app
      }
    }, 2000); // Defer by 2 seconds
  },

  // Monitor battery level - deferred
  monitorBattery: () => {
    setTimeout(() => {
      try {
        if ('getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            const updateOptimizations = () => {
              if (battery.level < 0.2 && !battery.charging) {
                // Low battery mode
                document.documentElement.classList.add('low-battery');
                console.log('🔋 Low battery detected, enabling power-saving mode');

                // Reduce update frequency
                const style = document.createElement('style');
                style.textContent = `
                  * {
                    animation: none !important;
                    transition: none !important;
                  }
                  .power-intensive {
                    display: none !important;
                  }
                `;
                document.head.appendChild(style);
              } else {
                document.documentElement.classList.remove('low-battery');
              }
            };

            battery.addEventListener('levelchange', updateOptimizations);
            battery.addEventListener('chargingchange', updateOptimizations);

            updateOptimizations();
          });
        }
      } catch (error) {
        // Silently fail to avoid blocking app
      }
    }, 2000); // Defer by 2 seconds
  },

  // Initialize basic optimizations
  init: () => {
    console.log('🚀 Initializing basic mobile optimizations...');

    simpleMobileOptimizations.optimizeImages();
    simpleMobileOptimizations.slowConnectionMode();
    simpleMobileOptimizations.monitorBattery();

    console.log('✅ Basic mobile optimizations initialized');
  }
};

// Device capability detection
export const detectDeviceCapabilities = () => {
  const capabilities = {
    // Hardware
    cores: navigator.hardwareConcurrency || 1,
    memory: (navigator as any).deviceMemory || 1,
    touchscreen: 'ontouchstart' in window,

    // Software
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch (e) {
        return false;
      }
    })(),

    // Network
    connection: (navigator as any).connection?.effectiveType || 'unknown',

    // Storage
    indexedDB: 'indexedDB' in window,
    serviceWorker: 'serviceWorker' in navigator,

    // Sensors
    geolocation: 'geolocation' in navigator,
    accelerometer: 'DeviceMotionEvent' in window,
    gyroscope: 'DeviceOrientationEvent' in window,

    // Battery
    battery: 'getBattery' in navigator,

    // Performance
    performanceObserver: 'PerformanceObserver' in window,
    webVitals: typeof (window as any).webVitals !== 'undefined'
  };

  console.log('📱 Device capabilities detected:', capabilities);
  return capabilities;
};

// Performance profiling
export const performanceProfiler = {
  start: (label: string) => {
    if ('mark' in performance) {
      performance.mark(`${label}-start`);
    }
  },

  end: (label: string) => {
    if ('mark' in performance && 'measure' in performance) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const measure = performance.getEntriesByName(label)[0];
      console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
    }
  },

  profileFunction: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    performanceProfiler.start(label);
    const result = await fn();
    performanceProfiler.end(label);
    return result;
  }
};
