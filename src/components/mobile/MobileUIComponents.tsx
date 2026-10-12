import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanGestureHandler,
  State,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: string;
  rightAction?: string;
  leftColor?: string;
  rightColor?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = 'Delete',
  rightAction = 'Edit',
  leftColor = '#e53e3e',
  rightColor = '#3182ce',
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [showActions, setShowActions] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (translationX < -100 || velocityX < -500) {
        // Swipe left
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onSwipeLeft?.();
        });
      } else if (translationX > 100 || velocityX > 500) {
        // Swipe right
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onSwipeRight?.();
        });
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Background Actions */}
      <View style={styles.backgroundActions}>
        <View style={[styles.actionButton, styles.leftAction, { backgroundColor: leftColor }]}>
          <Text style={styles.actionText}>{leftAction}</Text>
        </View>
        <View style={[styles.actionButton, styles.rightAction, { backgroundColor: rightColor }]}>
          <Text style={styles.actionText}>{rightAction}</Text>
        </View>
      </View>
      
      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.swipeableContent,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Pull to Refresh Component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing,
}) => {
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <Animated.View style={styles.refreshControl}>
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <Text style={styles.refreshText}>Refreshing...</Text>
            </View>
          )}
        </Animated.View>
      }
      onScrollBeginDrag={() => {}}
      onScrollEndDrag={() => {}}
    >
      {children}
    </ScrollView>
  );
};

// Bottom Sheet Component
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.bottomSheetOverlay}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity },
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouch} />
        </TouchableWithoutFeedback>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.bottomSheetHandle} />
        {title && (
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSheetContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

// Floating Action Button
interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon = '+',
  label,
  position = 'bottom-right',
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'top-right':
        return { top: 20, right: 20 };
      case 'top-left':
        return { top: 20, left: 20 };
      default:
        return { bottom: 20, right: 20 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        getPositionStyle(),
        {
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fabButton}
      >
        <Text style={styles.fabIcon}>{icon}</Text>
        {label && <Text style={styles.fabLabel}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated List Item
interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  onPress,
}) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.animatedListItem,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={styles.animatedListItemTouch}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Haptic Feedback Button
interface HapticButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  hapticType?: 'light' | 'medium' | 'heavy';
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  onPress,
  children,
  style,
  hapticType = 'light',
}) => {
  const handlePress = () => {
    // In a real app, you'd use expo-haptics here
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle[hapticType.toUpperCase()]);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.hapticButton, style]}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};

// Loading Skeleton
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
      ]}
    />
  );
};

// Long Press Handler
interface LongPressHandlerProps {
  onLongPress: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  delay?: number;
}

export const LongPressHandler: React.FC<LongPressHandlerProps> = ({
  onLongPress,
  onPress,
  children,
  delay = 500,
}) => {
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true);
      onLongPress();
    }, delay);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressed(false);
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <View style={[styles.longPressContainer, isLongPressed && styles.longPressed]}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Swipeable Card Styles
  swipeableContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  backgroundActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  leftAction: {
    marginRight: 'auto',
  },
  rightAction: {
    marginLeft: 'auto',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  swipeableContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Pull to Refresh Styles
  refreshControl: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIndicator: {
    padding: 10,
  },
  refreshText: {
    color: '#718096',
    fontSize: 14,
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    maxHeight: screenHeight * 0.8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#718096',
  },
  bottomSheetContent: {
    padding: 20,
  },
  // FAB Styles
  fab: {
    position: 'absolute',
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3182ce',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fabLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  // Animated List Item Styles
  animatedListItem: {
    marginVertical: 4,
  },
  animatedListItemTouch: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Haptic Button Styles
  hapticButton: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Skeleton Styles
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  // Long Press Handler Styles
  longPressContainer: {
    // Default styles
  },
  longPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export {
  SwipeableCard,
  PullToRefresh,
  BottomSheet,
  FAB,
  AnimatedListItem,
  HapticButton,
  Skeleton,
  LongPressHandler,
};
