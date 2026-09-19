import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/** Subtle entrance shared by cards: fade + 14px slide up, 320ms, staggered 80ms per index. */
export function useEnterAnimation(index = 0) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 320, delay: index * 80, useNativeDriver: true }).start();
  }, [enter, index]);
  return {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
}
