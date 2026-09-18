import React, { useRef } from "react";
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import { cssInterop } from "nativewind";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// On web, NativeWind does not process `className` on the Animated wrapper, so
// every utility on a PressableScale (flex-row, padding, radius, margin, ...)
// was silently dropped and cards collapsed into unstyled stacks. Registering
// the wrapper maps className -> style there. Native is left exactly as it was.
if (Platform.OS === "web") {
  cssInterop(AnimatedPressable, { className: "style" });
}

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** nativewind classes for the touch target (same as any Pressable). */
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** How far the element scales down while pressed. 0.96 = subtle (default). */
  activeScale?: number;
  children?: React.ReactNode;
}

/**
 * Drop-in replacement for <Pressable> that adds a subtle, fast press response
 * (slight scale-down + opacity dip, ~120ms) using React Native's built-in
 * Animated API — no extra animation library, works on web + native + jest.
 *
 * It animates the Pressable itself (via createAnimatedComponent) so layout is
 * byte-for-byte identical to a plain <Pressable> — percentage widths, flex
 * children and nativewind classes all behave exactly the same.
 *
 * Use for any interactive surface: cards, list rows, nav items, banners,
 * quick-access rows. Keep the motion small; this is feedback, not decoration.
 */
export function PressableScale({
  className,
  style,
  activeScale = 0.96,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const value = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(value, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const opacity = value.interpolate({
    inputRange: [activeScale, 1],
    outputRange: [0.92, 1],
  });

  return (
    <AnimatedPressable
      disabled={disabled}
      accessibilityRole="button"
      onPressIn={(e) => {
        if (!disabled) animate(activeScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1);
        onPressOut?.(e);
      }}
      className={className}
      style={[style, { transform: [{ scale: value }], opacity }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
